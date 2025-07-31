// Enhanced Search Component with Smart Suggestions
import { NetworkInsightEngine, SearchResult } from './NetworkInsightEngine';

export class SmartSearch {
  private container: HTMLElement;
  private input!: HTMLInputElement;
  private resultsContainer!: HTMLElement;
  private insightEngine: NetworkInsightEngine;
  private onSelectCallback: (result: SearchResult) => void;
  
  constructor(containerId: string, insightEngine: NetworkInsightEngine, onSelect: (result: SearchResult) => void) {
    this.container = document.getElementById(containerId)!;
    this.insightEngine = insightEngine;
    this.onSelectCallback = onSelect;
    this.createSearchInterface();
  }

  private createSearchInterface() {
    this.container.innerHTML = `
      <div class="smart-search-container">
        <div class="search-input-wrapper">
          <input 
            type="text" 
            id="smart-search-input" 
            placeholder="🔍 Search people, places, insights..." 
            class="smart-search-input"
          />
          <div class="search-suggestions" id="search-suggestions"></div>
        </div>
        <div class="quick-filters">
          <button class="filter-chip" data-filter="super_connectors">⭐ Super Connectors</button>
          <button class="filter-chip" data-filter="geographic">🌍 Geographic</button>
          <button class="filter-chip" data-filter="isolated">🏝️ Isolated</button>
          <button class="filter-chip" data-filter="recent">⏱️ Recent Activity</button>
        </div>
        <div class="search-results" id="search-results"></div>
      </div>
    `;

    this.input = document.getElementById('smart-search-input') as HTMLInputElement;
    this.resultsContainer = document.getElementById('search-results')!;
    
    this.setupEventListeners();
  }

  private setupEventListeners() {
    let searchTimeout: NodeJS.Timeout;

    // Real-time search with debouncing
    this.input.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = (e.target as HTMLInputElement).value.trim();
      
      if (query.length === 0) {
        this.showQuickInsights();
        return;
      }

      searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 200);
    });

    // Quick filter buttons
    this.container.querySelectorAll('.filter-chip').forEach(button => {
      button.addEventListener('click', (e) => {
        const filter = (e.target as HTMLElement).dataset.filter!;
        this.performQuickFilter(filter);
      });
    });

    // Show insights by default
    this.showQuickInsights();
  }

  private performSearch(query: string) {
    const results = this.insightEngine.smartSearch(query);
    this.displayResults(results, `Search results for "${query}"`);
  }

  private performQuickFilter(filter: string) {
    const insights = this.insightEngine.generateBasicInsights();
    let filteredInsights;

    switch (filter) {
      case 'super_connectors':
        filteredInsights = insights.filter(i => i.type === 'super_connector');
        break;
      case 'geographic':
        filteredInsights = insights.filter(i => i.type === 'geographic_cluster');
        break;
      case 'isolated':
        filteredInsights = insights.filter(i => i.type === 'isolated_nodes');
        break;
      default:
        filteredInsights = insights;
    }

    const results: SearchResult[] = filteredInsights.map(insight => ({
      type: 'insight',
      item: insight,
      score: 1,
      reason: 'Filter match'
    }));

    this.displayResults(results, `${filter.replace('_', ' ')} insights`);
  }

  private showQuickInsights() {
    const insights = this.insightEngine.generateBasicInsights();
    const results: SearchResult[] = insights.slice(0, 5).map(insight => ({
      type: 'insight',
      item: insight,
      score: 1,
      reason: 'Quick insight'
    }));

    this.displayResults(results, 'Smart Insights for Your Network');
  }

  private displayResults(results: SearchResult[], title: string) {
    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <div class="no-results-text">No results found</div>
          <div class="no-results-suggestion">Try a different search term or use the quick filters above</div>
        </div>
      `;
      return;
    }

    this.resultsContainer.innerHTML = `
      <div class="results-header">
        <h3>${title}</h3>
        <span class="results-count">${results.length} result${results.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="results-list">
        ${results.map(result => this.renderResult(result)).join('')}
      </div>
    `;

    // Add click listeners to results
    this.resultsContainer.querySelectorAll('.result-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.onSelectCallback(results[index]);
      });
    });
  }

  private renderResult(result: SearchResult): string {
    if (result.type === 'node') {
      const node = result.item;
      const avatar = node.avatar ? `<img src="${node.avatar}" class="result-avatar" />` : '';
      const displayName = node.profile?.displayName || node.name || node.id;
      const location = node.profile?.location?.city ? `, ${node.profile.location.city}` : '';
      const connections = this.insightEngine.calculateNodeCentrality(node.id);
      
      return `
        <div class="result-item result-node" data-type="node">
          <div class="result-content">
            <div class="result-header">
              ${avatar}
              <div class="result-info">
                <div class="result-title">${displayName}</div>
                <div class="result-subtitle">${node.type}${location}</div>
              </div>
              <div class="result-metric">
                <span class="metric-value">${connections.degree}</span>
                <span class="metric-label">connections</span>
              </div>
            </div>
            <div class="result-reason">${result.reason}</div>
          </div>
        </div>
      `;
    } else if (result.type === 'insight') {
      const insight = result.item;
      const priorityColor = insight.priority === 'high' ? '#e74c3c' : 
                           insight.priority === 'medium' ? '#f39c12' : '#95a5a6';
      
      return `
        <div class="result-item result-insight" data-type="insight">
          <div class="result-content">
            <div class="result-header">
              <div class="insight-icon" style="background: ${priorityColor}">
                ${this.getInsightIcon(insight.type)}
              </div>
              <div class="result-info">
                <div class="result-title">${insight.title}</div>
                <div class="result-subtitle">${insight.description}</div>
              </div>
              <div class="result-priority priority-${insight.priority}">
                ${insight.priority}
              </div>
            </div>
            <div class="result-stats">
              <span>${insight.nodes.length} people involved</span>
            </div>
          </div>
        </div>
      `;
    }
    
    return '';
  }

  private getInsightIcon(type: string): string {
    switch (type) {
      case 'super_connector': return '⭐';
      case 'isolated_nodes': return '🏝️';
      case 'geographic_cluster': return '🌍';
      case 'bridge_connector': return '🌉';
      default: return '💡';
    }
  }

  // Public method to update search results when data changes
  public refresh() {
    this.insightEngine.updateData();
    if (this.input.value.trim()) {
      this.performSearch(this.input.value.trim());
    } else {
      this.showQuickInsights();
    }
  }
}
