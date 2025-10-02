#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data storage
let productsData = [];

// Helper function to parse TSV and handle <LOQ values
function parseValue(value) {
  if (!value || value === '<LOQ' || value.startsWith('<')) {
    return 0;
  }
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// Load and parse TSV data
async function loadData() {
  try {
    const tsvPath = path.join(__dirname, 'plasticlist-oct-2025.tsv');
    const data = await fs.readFile(tsvPath, 'utf-8');
    const lines = data.trim().split('\n');
    const headers = lines[0].split('\t');

    productsData = lines.slice(1).map((line, idx) => {
      const values = line.split('\t');
      const product = {};

      headers.forEach((header, i) => {
        product[header] = values[i] || '';
      });

      return product;
    });

    console.error(`Loaded ${productsData.length} products from TSV file`);
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

// Tool implementations
function searchProducts(query, searchBy = 'all') {
  const lowerQuery = query.toLowerCase();

  const results = productsData.filter(product => {
    if (searchBy === 'name' || searchBy === 'all') {
      if (product.product?.toLowerCase().includes(lowerQuery)) return true;
    }
    if (searchBy === 'tags' || searchBy === 'all') {
      if (product.tags?.toLowerCase().includes(lowerQuery)) return true;
    }
    if (searchBy === 'location' || searchBy === 'all') {
      if (product.collected_at?.toLowerCase().includes(lowerQuery)) return true;
    }
    return false;
  });

  return results.map(p => ({
    id: p.id,
    product_id: p.product_id,
    product: p.product,
    location: p.collected_at,
    tags: p.tags,
    DEHP_equivalents_ng_g: parseValue(p.DEHP_equivalents_ng_g),
    DEHP_ng_g: parseValue(p.DEHP_ng_g),
    DBP_ng_g: parseValue(p.DBP_ng_g),
    BBP_ng_g: parseValue(p.BBP_ng_g),
    BPA_ng_g: parseValue(p.BPA_ng_g),
    BPS_ng_g: parseValue(p.BPS_ng_g),
  }));
}

function getProductDetails(identifier) {
  const product = productsData.find(p =>
    p.id === identifier ||
    p.product_id === identifier ||
    p.product?.toLowerCase() === identifier.toLowerCase()
  );

  if (!product) {
    return { error: 'Product not found' };
  }

  return {
    id: product.id,
    product_id: product.product_id,
    product: product.product,
    tags: product.tags,
    collected_at: product.collected_at,
    collected_on: product.collected_on,
    serving_size_g: parseValue(product.serving_size_g),
    chemicals_ng_g: {
      DEHP_equivalents: parseValue(product.DEHP_equivalents_ng_g),
      DEHP: parseValue(product.DEHP_ng_g),
      DBP: parseValue(product.DBP_ng_g),
      BBP: parseValue(product.BBP_ng_g),
      DINP: parseValue(product.DINP_ng_g),
      BPA: parseValue(product.BPA_ng_g),
      BPS: parseValue(product.BPS_ng_g),
      BPF: parseValue(product.BPF_ng_g),
      DEP: parseValue(product.DEP_ng_g),
      DMP: parseValue(product.DMP_ng_g),
      DEHT: parseValue(product.DEHT_ng_g),
    },
    percentiles: {
      DEHP_equivalents: parseValue(product.DEHP_equivalents_percentile_ng_g),
      DEHP: parseValue(product.DEHP_percentile_ng_g),
      DBP: parseValue(product.DBP_percentile_ng_g),
      BBP: parseValue(product.BBP_percentile_ng_g),
      DINP: parseValue(product.DINP_percentile_ng_g),
      BPA: parseValue(product.BPA_percentile_ng_g),
      BPS: parseValue(product.BPS_percentile_ng_g),
      BPF: parseValue(product.BPF_percentile_ng_g),
    }
  };
}

function compareProducts(identifiers) {
  const products = identifiers.map(id => {
    const product = productsData.find(p =>
      p.id === id ||
      p.product_id === id ||
      p.product?.toLowerCase() === id.toLowerCase()
    );

    if (!product) return null;

    return {
      id: product.id,
      product: product.product,
      tags: product.tags,
      location: product.collected_at,
      DEHP_equivalents_ng_g: parseValue(product.DEHP_equivalents_ng_g),
      DEHP_ng_g: parseValue(product.DEHP_ng_g),
      DBP_ng_g: parseValue(product.DBP_ng_g),
      BBP_ng_g: parseValue(product.BBP_ng_g),
      DINP_ng_g: parseValue(product.DINP_ng_g),
      BPA_ng_g: parseValue(product.BPA_ng_g),
      BPS_ng_g: parseValue(product.BPS_ng_g),
      BPF_ng_g: parseValue(product.BPF_ng_g),
      percentile_DEHP_equiv: parseValue(product.DEHP_equivalents_percentile_ng_g),
    };
  }).filter(p => p !== null);

  return {
    comparison: products,
    count: products.length
  };
}

function findSafestInCategory(category) {
  const filtered = productsData.filter(p =>
    p.tags?.toLowerCase().includes(category.toLowerCase())
  );

  const sorted = filtered
    .map(p => ({
      id: p.id,
      product: p.product,
      tags: p.tags,
      location: p.collected_at,
      DEHP_equivalents_ng_g: parseValue(p.DEHP_equivalents_ng_g),
      DEHP_equivalents_percentile: parseValue(p.DEHP_equivalents_percentile_ng_g),
    }))
    .sort((a, b) => a.DEHP_equivalents_ng_g - b.DEHP_equivalents_ng_g);

  return {
    category,
    total_products: sorted.length,
    safest_products: sorted.slice(0, 10)
  };
}

function analyzeByPackaging(packagingType = null) {
  let filtered = productsData;

  if (packagingType) {
    filtered = productsData.filter(p =>
      p.tags?.toLowerCase().includes(packagingType.toLowerCase())
    );
  }

  const packagingTypes = ['plastic', 'glass', 'carton'];
  const analysis = {};

  packagingTypes.forEach(type => {
    const products = filtered.filter(p =>
      p.tags?.toLowerCase().includes(type)
    );

    if (products.length > 0) {
      const dehpValues = products.map(p => parseValue(p.DEHP_equivalents_ng_g));
      const avg = dehpValues.reduce((sum, val) => sum + val, 0) / dehpValues.length;
      const min = Math.min(...dehpValues);
      const max = Math.max(...dehpValues);

      analysis[type] = {
        count: products.length,
        avg_DEHP_equivalents: avg.toFixed(2),
        min_DEHP_equivalents: min,
        max_DEHP_equivalents: max,
        examples: products.slice(0, 3).map(p => ({
          product: p.product,
          DEHP_equivalents_ng_g: parseValue(p.DEHP_equivalents_ng_g)
        }))
      };
    }
  });

  return analysis;
}

function organicVsConventional(foodType = null) {
  let filtered = productsData;

  if (foodType) {
    filtered = productsData.filter(p =>
      p.tags?.toLowerCase().includes(foodType.toLowerCase()) ||
      p.product?.toLowerCase().includes(foodType.toLowerCase())
    );
  }

  const organic = filtered.filter(p =>
    p.tags?.toLowerCase().includes('organic')
  );

  const conventional = filtered.filter(p =>
    !p.tags?.toLowerCase().includes('organic')
  );

  const calcStats = (products) => {
    if (products.length === 0) return null;

    const dehpValues = products.map(p => parseValue(p.DEHP_equivalents_ng_g));
    const avg = dehpValues.reduce((sum, val) => sum + val, 0) / dehpValues.length;
    const min = Math.min(...dehpValues);
    const max = Math.max(...dehpValues);

    return {
      count: products.length,
      avg_DEHP_equivalents: avg.toFixed(2),
      min_DEHP_equivalents: min,
      max_DEHP_equivalents: max,
      examples: products.slice(0, 5).map(p => ({
        product: p.product,
        tags: p.tags,
        DEHP_equivalents_ng_g: parseValue(p.DEHP_equivalents_ng_g)
      }))
    };
  };

  return {
    food_type: foodType || 'all',
    organic: calcStats(organic),
    conventional: calcStats(conventional)
  };
}

// Create MCP server
const server = new Server(
  {
    name: 'microplastics-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_products',
        description: 'Search products by name, tags, or location. Returns matching products with key chemical levels.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (product name, tag, or location)'
            },
            search_by: {
              type: 'string',
              enum: ['all', 'name', 'tags', 'location'],
              description: 'Field to search in (default: all)',
              default: 'all'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_product_details',
        description: 'Get full details for a specific product by ID or name',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Product ID, product_id, or product name'
            }
          },
          required: ['identifier']
        }
      },
      {
        name: 'compare_products',
        description: 'Compare chemical levels between two or more products',
        inputSchema: {
          type: 'object',
          properties: {
            identifiers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of product IDs or names to compare'
            }
          },
          required: ['identifiers']
        }
      },
      {
        name: 'find_safest_in_category',
        description: 'Find products with lowest DEHP equivalents in a category (e.g., baby_food, dairy, organic)',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Category tag (e.g., baby_food, dairy, organic, vegetables)'
            }
          },
          required: ['category']
        }
      },
      {
        name: 'analyze_by_packaging',
        description: 'Compare chemical levels by packaging type (glass, plastic, carton)',
        inputSchema: {
          type: 'object',
          properties: {
            packaging_type: {
              type: 'string',
              description: 'Optional: specific packaging type to analyze (glass, plastic, carton)',
              enum: ['glass', 'plastic', 'carton']
            }
          }
        }
      },
      {
        name: 'organic_vs_conventional',
        description: 'Compare organic vs conventional versions of foods',
        inputSchema: {
          type: 'object',
          properties: {
            food_type: {
              type: 'string',
              description: 'Optional: specific food type to analyze (e.g., milk, broccoli)'
            }
          }
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_products': {
        const results = searchProducts(args.query, args.search_by || 'all');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }]
        };
      }

      case 'get_product_details': {
        const details = getProductDetails(args.identifier);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(details, null, 2)
          }]
        };
      }

      case 'compare_products': {
        const comparison = compareProducts(args.identifiers);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(comparison, null, 2)
          }]
        };
      }

      case 'find_safest_in_category': {
        const safest = findSafestInCategory(args.category);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(safest, null, 2)
          }]
        };
      }

      case 'analyze_by_packaging': {
        const analysis = analyzeByPackaging(args.packaging_type);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(analysis, null, 2)
          }]
        };
      }

      case 'organic_vs_conventional': {
        const comparison = organicVsConventional(args.food_type);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(comparison, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});

// Start the server
async function main() {
  await loadData();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Microplastics MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
