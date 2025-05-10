class Pagination {
    constructor(containerSelector, totalItems, itemsPerPage = 10, onPageChange) {
        this.container = document.querySelector(containerSelector);
        this.totalItems = totalItems;
        this.itemsPerPage = itemsPerPage;
        this.totalPages = Math.ceil(totalItems / itemsPerPage);
        this.currentPage = 1;
        this.onPageChange = onPageChange;
        this.maxPagesToShow = 5; // Maximum number of page buttons to show at once
        this.init();
    }

    init() {
        if (!this.container) {
            console.error(`Pagination container not found: ${this.containerSelector}`);
            return;
        }
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = ''; // Clear existing content

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'prev';
        prevButton.innerHTML = '← Previous';
        prevButton.disabled = this.currentPage === 1;
        this.container.appendChild(prevButton);

        // Page numbers
        const { startPage, endPage } = this.calculatePageRange();
        
        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `page ${i === this.currentPage ? 'active' : ''}`;
            pageButton.textContent = i;
            this.container.appendChild(pageButton);
        }

        // Add dots if there are skipped pages
        if (endPage < this.totalPages) {
            const dots = document.createElement('span');
            dots.className = 'dots';
            dots.textContent = '...';
            this.container.appendChild(dots);

            // Add last page
            const lastPageButton = document.createElement('button');
            lastPageButton.className = 'page';
            lastPageButton.textContent = this.totalPages;
            this.container.appendChild(lastPageButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'next';
        nextButton.innerHTML = 'Next →';
        nextButton.disabled = this.currentPage === this.totalPages || this.totalItems === 0;
        this.container.appendChild(nextButton);
    }

    calculatePageRange() {
        let startPage = Math.max(1, this.currentPage - Math.floor(this.maxPagesToShow / 2));
        let endPage = Math.min(this.totalPages, startPage + this.maxPagesToShow - 1);

        // Adjust startPage if endPage is at the maximum
        if (endPage - startPage + 1 < this.maxPagesToShow) {
            startPage = Math.max(1, endPage - this.maxPagesToShow + 1);
        }

        return { startPage, endPage };
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const target = e.target;

            if (target.classList.contains('prev') && this.currentPage > 1) {
                this.currentPage--;
                this.render();
                this.onPageChange(this.currentPage);
            }

            if (target.classList.contains('next') && this.currentPage < this.totalPages) {
                this.currentPage++;
                this.render();
                this.onPageChange(this.currentPage);
            }

            if (target.classList.contains('page')) {
                const page = parseInt(target.textContent);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.render();
                    this.onPageChange(this.currentPage);
                }
            }
        });
    }

    setPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.render();
        }
    }

    updateTotalItems(newTotalItems) {
        this.totalItems = newTotalItems;
        this.totalPages = Math.ceil(newTotalItems / this.itemsPerPage);
        this.currentPage = Math.min(this.currentPage, this.totalPages) || 1;
        this.render();
    }
}

// Export the Pagination class for use in other scripts
window.Pagination = Pagination;