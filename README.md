# Microplastics MCP Server

An MCP (Model Context Protocol) server for querying microplastics and chemical data in Bay Area foods. This server provides tools to search, analyze, and compare chemical contamination levels across 600+ food products.

## Features

- **Search Products**: Find products by name, tags, or store location
- **Product Details**: Get comprehensive chemical analysis for specific products
- **Compare Products**: Side-by-side comparison of chemical levels
- **Category Analysis**: Find the safest products in categories (baby food, dairy, organic, etc.)
- **Packaging Analysis**: Compare chemical levels across different packaging types (glass, plastic, carton)
- **Organic vs Conventional**: Compare organic and conventional versions of foods

## Data Source

**Citation**: PlasticList. 'Data on Plastic Chemicals in Bay Area Foods'. plasticlist.org. Accessed Oct 02, 2025.

The dataset includes:
- 618 food products collected from Bay Area stores
- Chemical measurements: DEHP, DBP, BBP, DINP, BPA, BPS, BPF, DEP, DMP, DEHT
- DEHP equivalents (total chemical load)
- Percentile rankings for each chemical
- Product categories: baby food, dairy, produce, meat, beverages, and more

**Data License**: This dataset is provided by PlasticList (plasticlist.org). Please refer to their website for specific data usage terms and conditions.

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Claude Desktop app

### Steps

1. **Clone the repository**:
```bash
git clone https://github.com/differentstuff/microplastics-mcp.git
cd microplastics-mcp
```

2. **Install dependencies**:
```bash
npm install
npm audit fix
```

3. **Configure Claude Desktop**:

Add this to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "microplastics": {
      "command": "node",
      "args": ["/FULL/PATH/TO/microplastics-mcp/server.js"]
    }
  }
}
```

Replace `/FULL/PATH/TO/` with the actual path where you cloned the repository.

4. **Restart Claude Desktop**

## Usage

Once configured, you can ask Claude questions like:

### Search Examples
- "Search for all baby food products"
- "Find organic dairy products"
- "Show me products from Whole Foods"

### Safety Analysis
- "What are the safest baby foods?"
- "Find the cleanest dairy products"
- "Which vegetables have the lowest microplastics?"

### Comparisons
- "Compare organic vs conventional milk"
- "Compare glass vs plastic packaging"
- "Compare Gerber baby food with Happy Baby"

### Detailed Analysis
- "Get full details for Straus Organic Whole Milk"
- "Show chemical levels in all strawberry products"

## Available Tools

### 1. search_products
Search products by name, tags, or location.

**Parameters**:
- `query` (string): Search term
- `search_by` (optional): 'all', 'name', 'tags', or 'location'

### 2. get_product_details
Get complete chemical analysis for a specific product.

**Parameters**:
- `identifier` (string): Product ID or name

### 3. compare_products
Compare multiple products side-by-side.

**Parameters**:
- `identifiers` (array): List of product IDs or names

### 4. find_safest_in_category
Find products with lowest chemical levels in a category.

**Parameters**:
- `category` (string): Category tag (e.g., 'baby_food', 'dairy', 'organic')

### 5. analyze_by_packaging
Compare chemical levels by packaging type.

**Parameters**:
- `packaging_type` (optional): 'glass', 'plastic', or 'carton'

### 6. organic_vs_conventional
Compare organic vs conventional foods.

**Parameters**:
- `food_type` (optional): Specific food to analyze (e.g., 'milk', 'broccoli')

## Data Notes

- Values marked as `<LOQ` (below limit of quantification) are treated as 0
- Chemical measurements are in ng/g (nanograms per gram)
- DEHP equivalents represent total phthalate exposure
- Percentiles rank products relative to the entire dataset

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

This project uses data from **PlasticList** (plasticlist.org), an initiative to measure and publicly share plastic chemical contamination data in foods.

Special thanks to PlasticList for their work in collecting and making available data on plastic chemicals in Bay Area foods, helping consumers make informed choices about microplastics and chemical exposure.

**Data Citation**: PlasticList. 'Data on Plastic Chemicals in Bay Area Foods'. plasticlist.org. Accessed Oct 02, 2025.
