/**
 * Search System Frontend Components
 * 
 * Comprehensive frontend implementation for the NEXUS Search System
 * including advanced search interface, suggestions, and results display.
 */

class SearchSystem {
  constructor() {
    this.config = {
      apiBaseUrl: '/api/search',
      debounceDelay: 300,
      maxSuggestions: 10,
      highlightTag: 'mark',
      resultLimit: 20
    };
    
    this.state = {
      currentQuery: '',
      currentPage: 1,
      filters: {},
      sort: 'relevance',
      results: [],
      suggestions: [],
      facets: {},
      isLoading: false,
      totalResults: 0,
      searchHistory: [],
      savedSearches: []
    };
    
    this.elements = {};
    this.debounceTimer = null;
    
    this.init();
  }

  /**
   * Initialize the search system
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadSearchHistory();
    this.loadSavedSearches();
    this.setupAutoComplete();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      searchInput: document.getElementById('search-input'),
      searchButton: document.getElementById('search-button'),
      suggestionsContainer: document.getElementById('suggestions-container'),
      resultsContainer: document.getElementById('results-container'),
      facetsContainer: document.getElementById('facets-container'),
      paginationContainer: document.getElementById('pagination-container'),
      filtersContainer: document.getElementById('filters-container'),
      advancedSearchToggle: document.getElementById('advanced-search-toggle'),
      advancedSearchForm: document.getElementById('advanced-search-form'),
      savedSearchesContainer: document.getElementById('saved-searches-container'),
      searchHistoryContainer: document.getElementById('search-history-container'),
      loadingIndicator: document.getElementById('loading-indicator'),
      noResultsMessage: document.getElementById('no-results-message'),
      errorMessage: document.getElementById('error-message')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Search input events
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e);
      });
      
      this.elements.searchInput.addEventListener('keydown', (e) => {
        this.handleSearchKeydown(e);
      });
      
      this.elements.searchInput.addEventListener('focus', () => {
        this.showSuggestions();
      });
    }

    // Search button
    if (this.elements.searchButton) {
      this.elements.searchButton.addEventListener('click', () => {
        this.performSearch();
      });
    }

    // Advanced search toggle
    if (this.elements.advancedSearchToggle) {
      this.elements.advancedSearchToggle.addEventListener('click', () => {
        this.toggleAdvancedSearch();
      });
    }

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.hideSuggestions();
      }
    });
  }

  /**
   * Handle search input with debouncing
   */
  handleSearchInput(e) {
    const query = e.target.value.trim();
    this.state.currentQuery = query;
    
    // Clear previous debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Debounce suggestions
    this.debounceTimer = setTimeout(() => {
      if (query.length >= 2) {
        this.fetchSuggestions(query);
      } else {
        this.hideSuggestions();
      }
    }, this.config.debounceDelay);
  }

  /**
   * Handle search input keyboard events
   */
  handleSearchKeydown(e) {
    const suggestions = this.state.suggestions;
    let selectedIndex = -1;
    
    // Find current selected index
    const selectedElement = this.elements.suggestionsContainer.querySelector('.suggestion-item.selected');
    if (selectedElement) {
      selectedIndex = Array.from(this.elements.suggestionsContainer.children).indexOf(selectedElement);
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
        this.selectSuggestion(selectedIndex);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        this.selectSuggestion(selectedIndex);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          this.applySuggestion(suggestions[selectedIndex]);
        } else {
          this.performSearch();
        }
        break;
        
      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  /**
   * Setup auto-complete functionality
   */
  setupAutoComplete() {
    // Create suggestions container if it doesn't exist
    if (!this.elements.suggestionsContainer) {
      const container = document.createElement('div');
      container.id = 'suggestions-container';
      container.className = 'suggestions-container';
      this.elements.searchInput.parentNode.appendChild(container);
      this.elements.suggestionsContainer = container;
    }
  }

  /**
   * Fetch search suggestions
   */
  async fetchSuggestions(query) {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/suggestions?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        this.state.suggestions = data.data.suggestions.slice(0, this.config.maxSuggestions);
        this.renderSuggestions();
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }

  /**
   * Render suggestions
   */
  renderSuggestions() {
    if (!this.elements.suggestionsContainer) return;
    
    this.elements.suggestionsContainer.innerHTML = '';
    
    if (this.state.suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }
    
    this.state.suggestions.forEach((suggestion, index) => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.textContent = suggestion;
      
      suggestionItem.addEventListener('click', () => {
        this.applySuggestion(suggestion);
      });
      
      suggestionItem.addEventListener('mouseenter', () => {
        this.selectSuggestion(index);
      });
      
      this.elements.suggestionsContainer.appendChild(suggestionItem);
    });
    
    this.showSuggestions();
  }

  /**
   * Select suggestion by index
   */
  selectSuggestion(index) {
    const items = this.elements.suggestionsContainer.children;
    
    // Remove previous selection
    Array.from(items).forEach(item => item.classList.remove('selected'));
    
    // Add selection to current item
    if (index >= 0 && index < items.length) {
      items[index].classList.add('selected');
    }
  }

  /**
   * Apply suggestion
   */
  applySuggestion(suggestion) {
    this.elements.searchInput.value = suggestion;
    this.state.currentQuery = suggestion;
    this.hideSuggestions();
    this.performSearch();
  }

  /**
   * Show suggestions
   */
  showSuggestions() {
    if (this.elements.suggestionsContainer) {
      this.elements.suggestionsContainer.style.display = 'block';
    }
  }

  /**
   * Hide suggestions
   */
  hideSuggestions() {
    if (this.elements.suggestionsContainer) {
      this.elements.suggestionsContainer.style.display = 'none';
    }
  }

  /**
   * Perform search
   */
  async performSearch(page = 1) {
    if (!this.state.currentQuery.trim()) return;
    
    this.showLoading();
    this.hideError();
    
    try {
      const params = new URLSearchParams({
        q: this.state.currentQuery,
        limit: this.config.resultLimit,
        offset: (page - 1) * this.config.resultLimit,
        sort: this.state.sort,
        ...this.state.filters
      });
      
      const response = await fetch(`${this.config.apiBaseUrl}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        this.state.results = data.data.results;
        this.state.totalResults = data.data.total;
        this.state.facets = data.data.facets || {};
        this.state.currentPage = page;
        
        this.renderResults();
        this.renderFacets();
        this.renderPagination();
        this.addToSearchHistory(this.state.currentQuery);
        
        if (this.state.results.length === 0) {
          this.showNoResults();
        }
      } else {
        this.showError(data.error);
      }
    } catch (error) {
      console.error('Search failed:', error);
      this.showError('Search failed. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Render search results
   */
  renderResults() {
    if (!this.elements.resultsContainer) return;
    
    this.elements.resultsContainer.innerHTML = '';
    
    if (this.state.results.length === 0) {
      this.showNoResults();
      return;
    }
    
    const resultsList = document.createElement('div');
    resultsList.className = 'search-results-list';
    
    this.state.results.forEach(result => {
      const resultItem = this.createResultItem(result);
      resultsList.appendChild(resultItem);
    });
    
    this.elements.resultsContainer.appendChild(resultsList);
  }

  /**
   * Create result item element
   */
  createResultItem(result) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    
    // Result header
    const header = document.createElement('div');
    header.className = 'result-header';
    
    const title = document.createElement('h3');
    title.className = 'result-title';
    title.innerHTML = this.highlightText(result.title, this.state.currentQuery);
    header.appendChild(title);
    
    // Result type badge
    const typeBadge = document.createElement('span');
    typeBadge.className = `result-type-badge ${result.type}`;
    typeBadge.textContent = result.type;
    header.appendChild(typeBadge);
    
    item.appendChild(header);
    
    // Result description
    if (result.description) {
      const description = document.createElement('div');
      description.className = 'result-description';
      description.innerHTML = this.highlightText(result.description, this.state.currentQuery);
      item.appendChild(description);
    }
    
    // Result metadata
    if (result.metadata) {
      const metadata = document.createElement('div');
      metadata.className = 'result-metadata';
      
      Object.entries(result.metadata).forEach(([key, value]) => {
        if (value && key !== 'content') {
          const metaItem = document.createElement('span');
          metaItem.className = 'metadata-item';
          metaItem.textContent = `${key}: ${value}`;
          metadata.appendChild(metaItem);
        }
      });
      
      item.appendChild(metadata);
    }
    
    // Result actions
    const actions = document.createElement('div');
    actions.className = 'result-actions';
    
    const viewButton = document.createElement('button');
    viewButton.className = 'btn btn-primary';
    viewButton.textContent = 'View';
    viewButton.addEventListener('click', () => {
      this.viewResult(result);
    });
    actions.appendChild(viewButton);
    
    item.appendChild(actions);
    
    return item;
  }

  /**
   * Highlight text with search terms
   */
  highlightText(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query.split(' ').join('|')})`, 'gi');
    return text.replace(regex, `<${this.config.highlightTag}>$1</${this.config.highlightTag}>`);
  }

  /**
   * Render facets
   */
  renderFacets() {
    if (!this.elements.facetsContainer) return;
    
    this.elements.facetsContainer.innerHTML = '';
    
    if (Object.keys(this.state.facets).length === 0) {
      return;
    }
    
    Object.entries(this.state.facets).forEach(([facetName, facetValues]) => {
      const facetSection = this.createFacetSection(facetName, facetValues);
      this.elements.facetsContainer.appendChild(facetSection);
    });
  }

  /**
   * Create facet section
   */
  createFacetSection(name, values) {
    const section = document.createElement('div');
    section.className = 'facet-section';
    
    const title = document.createElement('h4');
    title.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    section.appendChild(title);
    
    const valuesList = document.createElement('div');
    valuesList.className = 'facet-values';
    
    values.forEach(value => {
      const valueItem = document.createElement('div');
      valueItem.className = 'facet-value';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `facet-${name}-${value._id}`;
      checkbox.value = value._id;
      checkbox.addEventListener('change', (e) => {
        this.toggleFacet(name, value._id, e.target.checked);
      });
      
      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = `${value._id} (${value.count})`;
      
      valueItem.appendChild(checkbox);
      valueItem.appendChild(label);
      valuesList.appendChild(valueItem);
    });
    
    section.appendChild(valuesList);
    return section;
  }

  /**
   * Toggle facet filter
   */
  toggleFacet(facetName, value, checked) {
    if (!this.state.filters[facetName]) {
      this.state.filters[facetName] = [];
    }
    
    if (checked) {
      this.state.filters[facetName].push(value);
    } else {
      this.state.filters[facetName] = this.state.filters[facetName].filter(v => v !== value);
    }
    
    this.performSearch(1);
  }

  /**
   * Render pagination
   */
  renderPagination() {
    if (!this.elements.paginationContainer) return;
    
    this.elements.paginationContainer.innerHTML = '';
    
    const totalPages = Math.ceil(this.state.totalResults / this.config.resultLimit);
    
    if (totalPages <= 1) return;
    
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Previous button
    const prevButton = this.createPaginationButton('Previous', this.state.currentPage - 1, this.state.currentPage === 1);
    pagination.appendChild(prevButton);
    
    // Page numbers
    const startPage = Math.max(1, this.state.currentPage - 2);
    const endPage = Math.min(totalPages, this.state.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      const pageButton = this.createPaginationButton(i, i, i === this.state.currentPage);
      pagination.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = this.createPaginationButton('Next', this.state.currentPage + 1, this.state.currentPage === totalPages);
    pagination.appendChild(nextButton);
    
    this.elements.paginationContainer.appendChild(pagination);
  }

  /**
   * Create pagination button
   */
  createPaginationButton(text, page, disabled) {
    const button = document.createElement('button');
    button.className = 'pagination-button';
    button.textContent = text;
    button.disabled = disabled;
    
    if (!disabled) {
      button.addEventListener('click', () => {
        this.performSearch(page);
      });
    }
    
    return button;
  }

  /**
   * Toggle advanced search
   */
  toggleAdvancedSearch() {
    if (this.elements.advancedSearchForm) {
      const isVisible = this.elements.advancedSearchForm.style.display !== 'none';
      this.elements.advancedSearchForm.style.display = isVisible ? 'none' : 'block';
    }
  }

  /**
   * View result
   */
  viewResult(result) {
    // Navigate to result based on type
    switch (result.type) {
      case 'ticket':
        window.location.href = `/tickets/${result.id}`;
        break;
      case 'user':
        window.location.href = `/users/${result.id}`;
        break;
      case 'comment':
        window.location.href = `/tickets/${result.metadata.ticketId}#comment-${result.id}`;
        break;
      default:
        console.log('Unknown result type:', result.type);
    }
  }

  /**
   * Load search history
   */
  async loadSearchHistory() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/history`);
      const data = await response.json();
      
      if (data.success) {
        this.state.searchHistory = data.data;
        this.renderSearchHistory();
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  /**
   * Render search history
   */
  renderSearchHistory() {
    if (!this.elements.searchHistoryContainer) return;
    
    this.elements.searchHistoryContainer.innerHTML = '';
    
    if (this.state.searchHistory.length === 0) {
      return;
    }
    
    const historyList = document.createElement('div');
    historyList.className = 'search-history-list';
    
    this.state.searchHistory.slice(0, 10).forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const query = document.createElement('span');
      query.textContent = item.query;
      query.addEventListener('click', () => {
        this.elements.searchInput.value = item.query;
        this.state.currentQuery = item.query;
        this.performSearch();
      });
      
      const timestamp = document.createElement('small');
      timestamp.textContent = new Date(item.timestamp).toLocaleString();
      
      historyItem.appendChild(query);
      historyItem.appendChild(timestamp);
      historyList.appendChild(historyItem);
    });
    
    this.elements.searchHistoryContainer.appendChild(historyList);
  }

  /**
   * Add to search history
   */
  addToSearchHistory(query) {
    // Remove existing entry
    this.state.searchHistory = this.state.searchHistory.filter(item => item.query !== query);
    
    // Add to beginning
    this.state.searchHistory.unshift({
      query,
      timestamp: new Date().toISOString()
    });
    
    // Limit to 50 items
    this.state.searchHistory = this.state.searchHistory.slice(0, 50);
    
    this.renderSearchHistory();
  }

  /**
   * Load saved searches
   */
  async loadSavedSearches() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/saved`);
      const data = await response.json();
      
      if (data.success) {
        this.state.savedSearches = data.data;
        this.renderSavedSearches();
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }

  /**
   * Render saved searches
   */
  renderSavedSearches() {
    if (!this.elements.savedSearchesContainer) return;
    
    this.elements.savedSearchesContainer.innerHTML = '';
    
    if (this.state.savedSearches.length === 0) {
      return;
    }
    
    const savedList = document.createElement('div');
    savedList.className = 'saved-searches-list';
    
    this.state.savedSearches.forEach(search => {
      const searchItem = document.createElement('div');
      searchItem.className = 'saved-search-item';
      
      const name = document.createElement('span');
      name.textContent = search.name;
      name.addEventListener('click', () => {
        this.elements.searchInput.value = search.query;
        this.state.currentQuery = search.query;
        this.performSearch();
      });
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-sm btn-danger';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        this.deleteSavedSearch(search._id);
      });
      
      searchItem.appendChild(name);
      searchItem.appendChild(deleteButton);
      savedList.appendChild(searchItem);
    });
    
    this.elements.savedSearchesContainer.appendChild(savedList);
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(searchId) {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/saved/${searchId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        this.state.savedSearches = this.state.savedSearches.filter(search => search._id !== searchId);
        this.renderSavedSearches();
      }
    } catch (error) {
      console.error('Failed to delete saved search:', error);
    }
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    this.state.isLoading = true;
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = 'block';
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    this.state.isLoading = false;
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = 'none';
    }
  }

  /**
   * Show no results message
   */
  showNoResults() {
    if (this.elements.noResultsMessage) {
      this.elements.noResultsMessage.style.display = 'block';
    }
  }

  /**
   * Hide no results message
   */
  hideNoResults() {
    if (this.elements.noResultsMessage) {
      this.elements.noResultsMessage.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message;
      this.elements.errorMessage.style.display = 'block';
    }
  }

  /**
   * Hide error message
   */
  hideError() {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.style.display = 'none';
    }
  }
}

// Initialize search system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.searchSystem = new SearchSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchSystem;
}
