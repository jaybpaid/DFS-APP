const fs = require('fs').promises;
const path = require('path');

// THE SOLVER Complete Capture Script
// Following the comprehensive capture methodology

class TheSolverCapture {
  constructor() {
    this.baseUrl = 'https://thesolver.com/optimizer/nfl';
    this.captureDir = './capture/thesolver';
    this.routes = [];
    this.components = [];
    this.currentState = 1;
  }

  async setupDirectories() {
    const dirs = ['assets', 'html_raw', 'dom_trees', 'screenshots', 'har', 'mirror'];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.captureDir, dir), { recursive: true });
    }
  }

  async captureCurrentState(stateName, description) {
    const stateNum = String(this.currentState).padStart(2, '0');
    const prefix = `${stateNum}-${stateName}`;

    console.log(`Capturing state ${stateNum}: ${description}`);

    try {
      // Save raw HTML
      const html = await this.page.content();
      await fs.writeFile(
        path.join(this.captureDir, 'html_raw', `${prefix}.html`),
        html
      );

      // Create DOM dump as JSON
      const domData = await this.page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          outerHTML: document.documentElement.outerHTML,
          bodyClassList: Array.from(document.body.classList),
          allLinks: Array.from(document.querySelectorAll('a')).map(a => ({
            href: a.href,
            text: a.textContent.trim(),
            id: a.id,
            className: a.className,
          })),
          allButtons: Array.from(document.querySelectorAll('button')).map(btn => ({
            text: btn.textContent.trim(),
            id: btn.id,
            className: btn.className,
            disabled: btn.disabled,
          })),
          allInputs: Array.from(
            document.querySelectorAll('input, select, textarea')
          ).map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            className: input.className,
            value: input.value,
            placeholder: input.placeholder,
          })),
          playerTableData: Array.from(document.querySelectorAll('table tr'))
            .slice(1)
            .map(row => {
              const cells = row.querySelectorAll('td');
              return Array.from(cells).map(cell => cell.textContent.trim());
            }),
          visibleText: document.body.innerText,
        };
      });

      await fs.writeFile(
        path.join(this.captureDir, 'dom_trees', `${prefix}.json`),
        JSON.stringify(domData, null, 2)
      );

      // Add to routes
      this.routes.push({
        route: await this.page.url(),
        title: await this.page.title(),
        type: stateName,
        description: description,
        timestamp: new Date().toISOString(),
      });

      this.currentState++;
    } catch (error) {
      console.error(`Error capturing state ${stateName}:`, error);
    }
  }

  async discoverUIComponents() {
    console.log('Discovering UI components...');

    const components = await this.page.evaluate(() => {
      const components = [];

      // Find all major UI sections
      const sections = [
        { selector: 'table', name: 'Player Data Table', type: 'data-grid' },
        { selector: '[class*="lineup"]', name: 'Lineup Display', type: 'display' },
        { selector: 'select', name: 'Dropdown Controls', type: 'input' },
        { selector: 'input[type="checkbox"]', name: 'Toggle Controls', type: 'input' },
        { selector: 'button', name: 'Action Buttons', type: 'control' },
        { selector: '[class*="rule"]', name: 'Advanced Rules', type: 'logic' },
        { selector: '[class*="nav"]', name: 'Navigation', type: 'nav' },
        { selector: '[class*="filter"]', name: 'Filters', type: 'control' },
      ];

      sections.forEach(section => {
        const elements = document.querySelectorAll(section.selector);
        if (elements.length > 0) {
          components.push({
            name: section.name,
            type: section.type,
            count: elements.length,
            selector: section.selector,
            elements: Array.from(elements)
              .slice(0, 5)
              .map(el => ({
                tagName: el.tagName,
                id: el.id,
                className: el.className,
                text: el.textContent?.trim().substring(0, 50) || '',
                attributes: Array.from(el.attributes).map(attr => ({
                  name: attr.name,
                  value: attr.value,
                })),
              })),
          });
        }
      });

      return components;
    });

    this.components = components;
    return components;
  }

  async saveAssets() {
    console.log('Extracting and saving assets...');

    // Get all CSS, JS, and image URLs
    const assets = await this.page.evaluate(() => {
      const assets = {
        stylesheets: [],
        scripts: [],
        images: [],
        fonts: [],
      };

      // CSS files
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        assets.stylesheets.push(link.href);
      });

      // JS files
      document.querySelectorAll('script[src]').forEach(script => {
        assets.scripts.push(script.src);
      });

      // Images
      document.querySelectorAll('img').forEach(img => {
        if (img.src) assets.images.push(img.src);
      });

      // Background images from CSS
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\("(.+?)"\)/);
          if (match) assets.images.push(match[1]);
        }
      });

      return assets;
    });

    // Save asset list
    await fs.writeFile(
      path.join(this.captureDir, 'assets', 'asset-inventory.json'),
      JSON.stringify(assets, null, 2)
    );

    return assets;
  }

  async generateSitemap() {
    const sitemap = {
      baseUrl: this.baseUrl,
      captureDate: new Date().toISOString(),
      totalRoutes: this.routes.length,
      routes: this.routes,
    };

    await fs.writeFile(
      path.join(this.captureDir, 'sitemap.json'),
      JSON.stringify(sitemap, null, 2)
    );
  }

  async generateComponentsInventory() {
    let componentsMarkdown = `# THE SOLVER - UI Components Inventory

Generated: ${new Date().toISOString()}
Source: ${this.baseUrl}

## Overview
Complete inventory of all UI components found in The Solver's NFL optimizer interface.

`;

    this.components.forEach((component, index) => {
      componentsMarkdown += `## ${index + 1}. ${component.name}
- **Type:** ${component.type}
- **Count:** ${component.count}
- **Selector:** \`${component.selector}\`

### Elements Found:
`;
      component.elements.forEach((element, elemIndex) => {
        componentsMarkdown += `
#### ${elemIndex + 1}. ${element.tagName}
- **ID:** \`${element.id || 'none'}\`
- **Classes:** \`${element.className || 'none'}\`
- **Text:** "${element.text}"
- **Attributes:** ${element.attributes.map(attr => `${attr.name}="${attr.value}"`).join(', ')}
`;
      });

      componentsMarkdown += '\n---\n\n';
    });

    await fs.writeFile(path.join(this.captureDir, 'components.md'), componentsMarkdown);
  }

  async generateReadme() {
    const readme = `# The Solver - Capture Analysis

## Capture Information
- **Date:** ${new Date().toISOString()}
- **Source URL:** ${this.baseUrl}
- **Total States Captured:** ${this.routes.length}
- **Authentication:** Used existing Chrome profile session

## Folder Structure
\`\`\`
capture/thesolver/
├── assets/              # CSS, JS, images, fonts
├── html_raw/            # Raw HTML for each UI state
├── dom_trees/           # Serialized DOM as JSON
├── screenshots/         # Full-page screenshots
├── har/                 # Network traffic capture
├── mirror/              # Offline mirror
├── sitemap.json         # Discovered routes
├── components.md        # UI components inventory
└── readme.md           # This file
\`\`\`

## How to Use
1. Open \`mirror/index.html\` in a browser for offline viewing
2. Review \`components.md\` for UI element details  
3. Check \`dom_trees/\` for detailed DOM structure
4. View \`screenshots/\` for visual reference

## Key Features Captured
${this.components.map(c => `- ${c.name} (${c.count} instances)`).join('\n')}

## Known Limitations
- Dynamic data requires authentication
- Some API calls may not work offline
- Interactive features require backend integration
`;

    await fs.writeFile(path.join(this.captureDir, 'readme.md'), readme);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TheSolverCapture;
}
