import { render, screen, fireEvent, within } from '@testing-library/react';
import SortableTable from './SortableTable';

describe('SortableTable', () => {
    // Mock data setup
    const mockColumns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'age', label: 'Age', sortable: true },
        { key: 'city', label: 'City', sortable: false }
    ];

    const mockData = [
        { name: 'John', age: 25, city: 'New York' },
        { name: 'Alice', age: 30, city: 'London' },
        { name: 'Bob', age: 20, city: 'Paris' }
    ];

    describe('Rendering', () => {
        it('should render the correct number of rows based on initialRowsPerPage', () => {
            render(
                <SortableTable data={mockData} columns={mockColumns} initialRowsPerPage={2} />
            );
            // Now check that the number of data rows rendered is 2
            const rows = screen.getAllByRole('row');
            // rows includes header row, so total rows should be 1 (header) + 2 (data rows) = 3
            expect(rows).toHaveLength(3);
            // Alternatively, check data rows
            const dataRows = rows.slice(1); // Skip header row
            expect(dataRows).toHaveLength(2);
        });

        it('should apply custom class names when provided', () => {
            const customTableClass = 'custom-table-class';
            const customHeaderClass = 'custom-header-class';
            const customRowClass = 'custom-row-class';

            const { container } = render(
                <SortableTable
                    data={mockData}
                    columns={mockColumns}
                    tableClassName={customTableClass}
                    headerClassName={customHeaderClass}
                    rowClassName={customRowClass}
                />
            );

            // Check table has custom class
            const tableElement = screen.getByRole('table');
            expect(tableElement).toHaveClass(customTableClass);

            // Check header has custom class
            const headerElement = container.querySelector('thead');
            expect(headerElement).toHaveClass(customHeaderClass);

            // Check rows have custom class
            const dataRows = screen.getAllByRole('row').slice(1); // Skip header row
            dataRows.forEach((row) => {
                expect(row).toHaveClass(customRowClass);
            });
        });
    });

    describe('Sorting', () => {
        const data = [
            { name: 'Charlie', age: 25 },
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 20 },
        ];

        const columns = [
            { key: 'name', label: 'Name', sortable: true },
            { key: 'age', label: 'Age', sortable: true },
        ];

        it('should sort column in ascending order on first click', () => {
            render(<SortableTable data={data} columns={columns} />);

            // Click on the 'Name' column sort button
            const sortButtonName = screen.getByLabelText('Sort by Name');
            fireEvent.click(sortButtonName);

            // Get all data rows
            const rows = screen.getAllByRole('row');
            const dataRows = rows.slice(1); // Exclude header row

            // Extract names from the sorted rows
            const sortedNames = dataRows.map((row) => {
                const cell = within(row).getAllByRole('cell')[0];
                return cell.textContent;
            });

            expect(sortedNames).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        it('should sort column in descending order on second click', () => {
            render(<SortableTable data={data} columns={columns} />);

            // Click on the 'Name' column sort button twice
            const sortButtonName = screen.getByLabelText('Sort by Name');
            fireEvent.click(sortButtonName);
            fireEvent.click(sortButtonName);

            // Get all data rows
            const rows = screen.getAllByRole('row');
            const dataRows = rows.slice(1);

            // Extract names from the sorted rows
            const sortedNames = dataRows.map((row) => {
                const cell = within(row).getAllByRole('cell')[0];
                return cell.textContent;
            });

            expect(sortedNames).toEqual(['Charlie', 'Bob', 'Alice']);
        });

        it('should remove sorting on third click', () => {
            render(<SortableTable data={data} columns={columns} />);

            // Click on the 'Name' column sort button three times
            const sortButtonName = screen.getByLabelText('Sort by Name');
            fireEvent.click(sortButtonName);
            fireEvent.click(sortButtonName);
            fireEvent.click(sortButtonName);

            // Get all data rows
            const rows = screen.getAllByRole('row');
            const dataRows = rows.slice(1);

            // Extract names from the rows
            const names = dataRows.map((row) => {
                const cell = within(row).getAllByRole('cell')[0];
                return cell.textContent;
            });

            // Should be in original order
            expect(names).toEqual(['Charlie', 'Alice', 'Bob']);
        });

        it('should handle multiple column sorting', () => {
            render(<SortableTable data={data} columns={columns} />);

            // First, sort by 'Age' ascending
            const sortButtonAge = screen.getByLabelText('Sort by Age');
            fireEvent.click(sortButtonAge);

            // Then, sort by 'Name' ascending
            const sortButtonName = screen.getByLabelText('Sort by Name');
            fireEvent.click(sortButtonName);

            // Get all data rows
            const rows = screen.getAllByRole('row');
            const dataRows = rows.slice(1);

            // Extract names and ages from the sorted rows
            const sortedData = dataRows.map((row) => {
                const cells = within(row).getAllByRole('cell');
                return {
                    name: cells[0].textContent,
                    age: parseInt(cells[1].textContent ?? '', 10),
                };
            });

            expect(sortedData).toEqual([
                { name: 'Bob', age: 20 },
                { name: 'Charlie', age: 25 },
                { name: 'Alice', age: 30 },
            ]);
        });

        it('should maintain sort order when data updates', () => {
            const { rerender } = render(<SortableTable data={data} columns={columns} />);

            // Sort by 'Name' ascending
            const sortButtonName = screen.getByLabelText('Sort by Name');
            fireEvent.click(sortButtonName);

            // Update the data
            const newData = [
                { name: 'Eve', age: 22 },
                { name: 'Dave', age: 28 },
                ...data,
            ];
            rerender(<SortableTable data={newData} columns={columns} />);

            // Get all data rows
            const rows = screen.getAllByRole('row');
            const dataRows = rows.slice(1);

            // Extract names from the sorted rows
            const sortedNames = dataRows.map((row) => {
                const cell = within(row).getAllByRole('cell')[0];
                return cell.textContent;
            });

            expect(sortedNames).toEqual(['Alice', 'Bob', 'Charlie', 'Dave', 'Eve']);
        });
    });

    describe('Pagination', () => {
        const data = Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            name: `Item ${i + 1}`,
        }));

        const columns = [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: 'Name', sortable: true },
        ];

        it('should display correct number of rows based on rowsPerPage selection', () => {
            render(<SortableTable data={data} columns={columns} />);

            // Default rows per page is 10
            let rows = screen.getAllByRole('row');
            expect(rows).toHaveLength(11); // 1 header row + 10 data rows

            // Change rows per page to 20
            const rowsPerPageSelect = screen.getByLabelText('Per page:');
            fireEvent.change(rowsPerPageSelect, { target: { value: '20' } });

            rows = screen.getAllByRole('row');
            expect(rows).toHaveLength(21); // 1 header row + 20 data rows
        });

        it('should disable navigation buttons appropriately', () => {
            render(<SortableTable data={data} columns={columns} />);

            // On first page, previous and first buttons should be disabled
            const firstPageButton = screen.getByLabelText('First Page');
            const prevButton = screen.getByLabelText('Previous Page');
            const nextButton = screen.getByLabelText('Next Page');
            const lastPageButton = screen.getByLabelText('Last Page');

            expect(firstPageButton).toBeDisabled();
            expect(prevButton).toBeDisabled();
            expect(nextButton).not.toBeDisabled();
            expect(lastPageButton).not.toBeDisabled();

            // Navigate to last page
            fireEvent.click(lastPageButton);

            // On last page, next and last buttons should be disabled
            expect(firstPageButton).not.toBeDisabled();
            expect(prevButton).not.toBeDisabled();
            expect(nextButton).toBeDisabled();
            expect(lastPageButton).toBeDisabled();
        });

        it('should update current page display when navigating', () => {
            render(<SortableTable data={data} columns={columns} />);

            const nextButton = screen.getByLabelText('Next Page');
            const pageInfo = screen.getByText(/Page \d+ of \d+/);

            // Initially on page 1
            expect(pageInfo).toHaveTextContent('Page 1 of 5');

            // Navigate to page 2
            fireEvent.click(nextButton);
            expect(pageInfo).toHaveTextContent('Page 2 of 5');

            // Navigate to page 3
            fireEvent.click(nextButton);
            expect(pageInfo).toHaveTextContent('Page 3 of 5');
        });
    });

    describe('Edge Cases', () => {
        const columns = [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: 'Name', sortable: true },
            { key: 'value', label: 'Value', sortable: true },
        ];

        it('should handle empty data array', () => {
            render(<SortableTable data={[]} columns={columns} />);

            // Expect to find a message or no data rows
            const rows = screen.getAllByRole('row');
            expect(rows).toHaveLength(1); // Only header row should be present

            // Optionally, check for a 'No data' message if your component displays one
            const noDataMessage = screen.queryByText(/No data available/i);
            if (noDataMessage) {
                expect(noDataMessage).toBeInTheDocument();
            }
        });

        it('should handle single row of data', () => {
            const singleRowData = [{ id: 1, name: 'Single Item', value: 100 }];

            render(<SortableTable data={singleRowData} columns={columns} />);

            // Expect to find header row and one data row
            const rows = screen.getAllByRole('row');
            expect(rows).toHaveLength(2);

            // Verify the content of the single row
            const cells = within(rows[1]).getAllByRole('cell');
            expect(cells[0]).toHaveTextContent('1');
            expect(cells[1]).toHaveTextContent('Single Item');
            expect(cells[2]).toHaveTextContent('100');
        });

        it('should handle extremely large numbers of rows', () => {
            // Generate 10,000 rows of data
            const largeDataSet = Array.from({ length: 10000 }, (_, i) => ({
                id: i + 1,
                name: `Item ${i + 1}`,
                value: Math.floor(Math.random() * 1000),
            }));

            render(<SortableTable data={largeDataSet} columns={columns} />);

            // By default, only the first page should be rendered (e.g., 10 rows)
            const rowsPerPage = 10; // Assuming default is 10
            const rows = screen.getAllByRole('row');
            expect(rows).toHaveLength(rowsPerPage + 1); // +1 for header row

            // Verify that pagination shows correct total pages
            const totalPages = Math.ceil(largeDataSet.length / rowsPerPage);
            expect(screen.getByText(`Page 1 of ${totalPages}`)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        const data = [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
        ];

        const columns = [
            { key: 'name', label: 'Name', sortable: true },
            { key: 'age', label: 'Age', sortable: true },
        ];

        it('should have proper ARIA labels for sort buttons', () => {
            render(<SortableTable data={data} columns={columns} />);

            // Check that each sortable column header has a button with the correct ARIA label
            columns.forEach((column) => {
                if (column.sortable) {
                    const sortButton = screen.getByLabelText(`Sort by ${column.label}`);
                    expect(sortButton).toBeInTheDocument();
                    expect(sortButton).toHaveAttribute('aria-label', `Sort by ${column.label}`);
                }
            });
        });
    });
});