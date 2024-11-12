import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import App from './App';
import { getCities } from 'api/getCities';

// Mock the API call
jest.mock('api/getCities');
// Mock the SVG import
jest.mock('./assets/Search.svg', () => ({
    ReactComponent: () => <div data-testid="search-icon" />,
}));

describe('App Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Initial Rendering', () => {
        beforeEach(() => {
            // Mock getCities to return empty array by default
            (getCities as jest.Mock).mockResolvedValue([]);
        });

        it('should render the search input', () => {
            render(<App />);

            // Check if input element exists
            const searchInput = screen.getByRole('textbox', { name: /search for a city/i });
            expect(searchInput).toBeInTheDocument();

            // Verify input attributes
            expect(searchInput).toHaveAttribute('type', 'text');
            expect(searchInput).toHaveAttribute('id', 'search');
            expect(searchInput).toHaveAttribute('name', 'search');
        });

        it('should render the search icon', () => {
            render(<App />);

            // Check if search icon exists
            const searchIcon = screen.getByTestId('search-icon');
            expect(searchIcon).toBeInTheDocument();

            // Verify it's within the search bar container
            const searchContainer = screen.getByRole('search');
            expect(searchContainer).toContainElement(searchIcon);
        });

        it('should have the correct placeholder text', () => {
            render(<App />);

            // Check if input has correct placeholder
            const searchInput = screen.getByRole('textbox', { name: /search for a city/i });
            expect(searchInput).toHaveAttribute('placeholder', 'Search for a city');

            // Verify label text matches placeholder
            const label = screen.getByLabelText(/search for a city/i);
            expect(label).toBeInTheDocument();
        });

        it('should render the SortableTable when data is available', async () => {
            // Mock cities data
            const mockCities = [
                {
                    id: 1,
                    name: 'New York',
                    nameAscii: 'New York',
                    country: 'United States',
                    countryIso3: 'USA',
                    capital: 'primary',
                    population: 8000000
                },
                {
                    id: 2,
                    name: 'London',
                    nameAscii: 'London',
                    country: 'United Kingdom',
                    countryIso3: 'GBR',
                    capital: 'primary',
                    population: 9000000
                }
            ];

            // Mock API to return test data
            (getCities as jest.Mock).mockResolvedValue(mockCities);

            render(<App />);

            // Wait for the table to be rendered after data is loaded
            await waitFor(() => {
                // Check if table headers are rendered
                expect(screen.getByText('City Name')).toBeInTheDocument();
                expect(screen.getByText('Country')).toBeInTheDocument();
                expect(screen.getByText('Population')).toBeInTheDocument();
            });

            // Verify city data is displayed
            await waitFor(() => {
                expect(screen.getByText('New York')).toBeInTheDocument();
                expect(screen.getByText('London')).toBeInTheDocument();
                expect(screen.getByText('United States')).toBeInTheDocument();
                expect(screen.getByText('United Kingdom')).toBeInTheDocument();
            });

            // Verify loading state is not shown
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

            // Verify error state is not shown
            expect(screen.queryByText(/Oops! Something went wrong/)).not.toBeInTheDocument();
        });
    });

    describe('Search Functionality', () => {
        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should update search term when typing', () => {
            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'New York' } });
            });

            expect(searchInput).toHaveValue('New York');
        });

        it('should trigger search on input change', async () => {
            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'Paris' } });
            });

            await waitFor(() => {
                expect(getCities).toHaveBeenCalledWith({ searchTerm: 'Paris' });
            });
        });

        it('should focus input when clicking search icon', () => {
            render(<App />);

            const searchIconButton = screen.getByLabelText('Search');
            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Ensure input is not focused initially
            expect(document.activeElement).not.toBe(searchInput);

            // Click the search icon
            act(() => {
                fireEvent.click(searchIconButton);
            });

            // Input should now be focused
            expect(document.activeElement).toBe(searchInput);
        });

        it('should handle empty search term', async () => {
            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Enter a search term

            act(() => {
                fireEvent.change(searchInput, { target: { value: 'Tokyo' } });
            });

            await waitFor(() => {
                expect(getCities).toHaveBeenCalledWith({ searchTerm: 'Tokyo' });
            });

            act(() => {
                // Clear the search input
                fireEvent.change(searchInput, { target: { value: '' } });
            });

            await waitFor(() => {
                expect(getCities).toHaveBeenCalledWith({ searchTerm: '' });
            });
        });

        it('should trim whitespace from search term', async () => {
            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            act(() => {
                // Enter a search term with leading/trailing whitespace
                fireEvent.change(searchInput, { target: { value: '  Berlin  ' } });
            });

            await waitFor(() => {
                expect(getCities).toHaveBeenCalledWith({ searchTerm: 'Berlin' });
            });
        });
    });

    describe('API Integration', () => {
        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should call getCities with correct parameters', async () => {
            // Mock getCities to resolve with an empty array
            (getCities as jest.Mock).mockResolvedValue([]);

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Simulate typing 'Tokyo' into the search input
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'Tokyo' } });
            });

            // Wait for getCities to be called with 'Tokyo'
            await waitFor(() => {
                expect(getCities).toHaveBeenCalledWith({ searchTerm: 'Tokyo' });
            });
        });

        it('should display loading state while fetching', async () => {
            let resolvePromise!: (value: any) => void; // Use definite assignment assertion
            const pendingPromise = new Promise((resolve) => {
                resolvePromise = resolve;
            });

            // Mock getCities to return the pending promise
            (getCities as jest.Mock).mockReturnValue(pendingPromise);

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'Berlin' } });
            });

            // Expect loading indicator to be displayed
            expect(screen.getByRole('status')).toHaveTextContent('Loading...');

            // Resolve the promise to simulate API response
            resolvePromise([]);

            // Wait for loading indicator to disappear
            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });
        });

        it('should display error message when API fails', async () => {
            const errorMessage = 'Network Error';

            // Mock getCities to reject with an error
            (getCities as jest.Mock).mockRejectedValue(new Error(errorMessage));

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            act(() => {
                fireEvent.change(searchInput, { target: { value: 'Paris' } });
            });

            // Wait for error message to appear
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(
                    `Oops! Something went wrong: ${errorMessage}`
                );
            });
        });

        it('should display no results message when API returns empty array', async () => {
            // Mock getCities to resolve with an empty array
            (getCities as jest.Mock).mockResolvedValue([]);

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'UnknownCity' } });
            });

            // Wait for 'No cities found.' message to appear
            await waitFor(() => {
                expect(screen.getByRole('status')).toHaveTextContent('No cities found.');
            });
        });

        it('should update cities data when API call succeeds', async () => {
            const mockCities = [
                {
                    id: 1,
                    name: 'London',
                    country: 'United Kingdom',
                    population: 8900000,
                },
                {
                    id: 2,
                    name: 'Birmingham',
                    country: 'United Kingdom',
                    population: 1141816,
                },
            ];

            // Mock getCities to resolve with mock data
            (getCities as jest.Mock).mockResolvedValue(mockCities);

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'London' } });
            });

            // Wait for the table to display the new data
            await waitFor(() => {
                // Check that the city names are displayed
                expect(screen.getByText('London')).toBeInTheDocument();
                expect(screen.getByText('Birmingham')).toBeInTheDocument();
                // Check that the country names are displayed
                expect(screen.getAllByText('United Kingdom').length).toBeGreaterThan(0);
            });
        });
    });

    describe('State Management', () => {
        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should properly manage loading state', async () => {
            let resolvePromise!: (value: any) => void;
            const pendingPromise = new Promise((resolve) => {
                resolvePromise = resolve;
            });

            // Mock getCities to return the pending promise
            (getCities as jest.Mock).mockReturnValue(pendingPromise);

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Simulate typing into the search input
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'New York' } });
            });

            // Expect loading indicator to be displayed
            expect(screen.getByRole('status')).toHaveTextContent('Loading...');

            // Resolve the promise to simulate API response
            resolvePromise([]);

            // Wait for loading indicator to disappear
            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });
        });

        it('should properly manage error state', async () => {
            const errorMessage = 'Network Error';

            // Mock getCities to reject with an error
            (getCities as jest.Mock).mockRejectedValue(new Error(errorMessage));

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Simulate typing into the search input
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'Paris' } });
            });

            // Wait for error message to appear
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(
                    `Oops! Something went wrong: ${errorMessage}`
                );
            });
        });

        it('should properly manage noResults state', async () => {
            // Mock getCities to resolve with an empty array
            (getCities as jest.Mock).mockResolvedValue([]);

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Simulate typing into the search input
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'UnknownCity' } });
            });

            // Wait for 'No cities found.' message to appear
            await waitFor(() => {
                expect(screen.getByRole('status')).toHaveTextContent('No cities found.');
            });
        });

        it('should reset error state on successful API call', async () => {
            const errorMessage = 'Network Error';

            // First, mock getCities to reject with an error
            (getCities as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Simulate typing into the search input to trigger the error
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'ErrorCity' } });
            });

            // Wait for error message to appear
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(
                    `Oops! Something went wrong: ${errorMessage}`
                );
            });

            // Now mock getCities to resolve successfully
            const mockCities = [
                {
                    id: 1,
                    name: 'London',
                    country: 'United Kingdom',
                    population: 8900000,
                },
            ];
            (getCities as jest.Mock).mockResolvedValueOnce(mockCities);

            // Simulate typing into the search input to trigger a successful API call
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'London' } });
            });

            // Wait for the error message to disappear
            await waitFor(() => {
                expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            });

            // Wait for the table to display the new data
            await waitFor(() => {
                expect(screen.getByText('London')).toBeInTheDocument();
            });
        });

        it('should maintain state consistency during rapid searches', async () => {
            jest.useFakeTimers();

            // Mock getCities to resolve after a delay
            (getCities as jest.Mock).mockImplementation((params: any) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve([
                            {
                                id: 1,
                                name: params.searchTerm,
                                country: 'TestCountry',
                                population: 1000,
                            },
                        ]);
                    }, 200);
                });
            });

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Simulate rapid typing
            act(() => {
                fireEvent.change(searchInput, { target: { value: 'A' } });
                jest.advanceTimersByTime(100);
                fireEvent.change(searchInput, { target: { value: 'AB' } });
                jest.advanceTimersByTime(100);
                fireEvent.change(searchInput, { target: { value: 'ABC' } });
            });

            // Advance time to allow debounce and API calls to complete
            jest.advanceTimersByTime(300);

            // Run all pending timers
            act(() => {
                jest.runAllTimers();
            });

            // Wait for the data to be displayed
            await waitFor(() => {
                expect(screen.getByText('ABC')).toBeInTheDocument();
            });

            // Clean up fake timers
            jest.useRealTimers();
        });
    });

    describe('User Interactions', () => {
        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should handle keyboard navigation', async () => {
            // Mock getCities to resolve with multiple data entries
            (getCities as jest.Mock).mockResolvedValue(
                Array.from({ length: 30 }, (_, index) => ({
                    id: index + 1,
                    name: `Test City ${index + 1}`,
                    country: 'Test Country',
                    population: 1000 + index,
                }))
            );

            render(<App />);

            const user = userEvent.setup();

            // Wait for the table to render
            await waitFor(() => {
                expect(screen.getByText('Test City 1')).toBeInTheDocument();
            });

            // Start with focus on the document body
            document.body.focus();

            // Simulate tabbing through interactive elements
            await user.tab(); // Search icon button
            expect(screen.getByLabelText('Search')).toHaveFocus();

            await user.tab(); // Search input
            expect(screen.getByPlaceholderText('Search for a city')).toHaveFocus();

            // Sort buttons
            await user.tab(); // Sort by City Name
            expect(screen.getByLabelText('Sort by City Name')).toHaveFocus();

            await user.tab(); // Sort by Country
            expect(screen.getByLabelText('Sort by Country')).toHaveFocus();

            await user.tab(); // Sort by Population
            expect(screen.getByLabelText('Sort by Population')).toHaveFocus();

            // "Per page" select
            await user.tab();
            expect(screen.getByLabelText('Per page:')).toHaveFocus();

            // Pagination buttons
            await user.tab(); // "Previous Page" button (disabled, skip focus)
            expect(screen.getByLabelText('Next Page')).toHaveFocus();

            await user.tab(); // "Last Page" button
            expect(screen.getByLabelText('Last Page')).toHaveFocus();
        });



        it('should handle rapid typing', async () => {
            jest.useFakeTimers();

            const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

            // Mock getCities to resolve with different results based on search term
            (getCities as jest.Mock).mockImplementation((params: any) => {
                return Promise.resolve([
                    {
                        id: 1,
                        name: params.searchTerm,
                        country: 'TestCountry',
                        population: 1000,
                    },
                ]);
            });

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Simulate typing without the delay option
            await user.type(searchInput, 'RapidCity'); // Typing at default speed

            // Fast-forward timers to handle debounce
            act(() => {
                jest.runAllTimers();
            });

            // Wait for the results to be updated
            await waitFor(() => {
                expect(getCities).toHaveBeenCalledWith({ searchTerm: 'RapidCity' });
                expect(screen.getByText('RapidCity')).toBeInTheDocument();
            });

            jest.useRealTimers();
        });


        it('should handle form submission', async () => {
            const user = userEvent.setup();

            // Mock getCities to resolve with data
            (getCities as jest.Mock).mockResolvedValue([
                {
                    id: 1,
                    name: 'Los Angeles',
                    country: 'United States',
                    population: 4000000,
                },
            ]);

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Type into the search input and press Enter
            await user.type(searchInput, 'Los Angeles{enter}');

            // Wait for the results to be updated
            await waitFor(() => {
                expect(getCities).toHaveBeenCalledWith({ searchTerm: 'Los Angeles' });
                expect(screen.getByText('Los Angeles')).toBeInTheDocument();
            });
        });

        it('should maintain focus states correctly', async () => {
            render(<App />);

            const user = userEvent.setup();

            const searchIconButton = screen.getByLabelText('Search');
            const searchInput = screen.getByPlaceholderText('Search for a city');

            // Click on the search icon button
            await user.click(searchIconButton);

            // Check that the search input is focused
            expect(searchInput).toHaveFocus();

            // Simulate tabbing away from the search input
            await user.tab();
            expect(searchInput).not.toHaveFocus();

            // Simulate clicking back on the search input
            await user.click(searchInput);
            expect(searchInput).toHaveFocus();

            // Simulate typing in the search input
            await user.type(searchInput, 'Berlin');
            expect(searchInput).toHaveValue('Berlin');
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should handle network errors gracefully', async () => {
            const errorMessage = 'Network Error';

            // Mock getCities to reject with a network error
            (getCities as jest.Mock).mockRejectedValue(new Error(errorMessage));

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            act(() => {
                // Simulate typing into the search input
                fireEvent.change(searchInput, { target: { value: 'Paris' } });
            });

            // Wait for error message to appear
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(
                    `Oops! Something went wrong: ${errorMessage}`
                );
            });
        });

        it('should handle malformed API responses', async () => {
            // Mock getCities to resolve with malformed data
            (getCities as jest.Mock).mockResolvedValue(null); // Malformed response

            render(<App />);

            // Wait for error message to appear
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(
                    'Oops! Something went wrong'
                );
            });
        });

        it('should display user-friendly error messages', async () => {
            const errorMessage = 'Server is down';

            // Mock getCities to reject with an error
            (getCities as jest.Mock).mockRejectedValue(new Error(errorMessage));

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            act(() => {
                fireEvent.change(searchInput, { target: { value: 'Tokyo' } });
            });

            // Wait for error message to appear
            await waitFor(() => {
                // Check that a user-friendly message is displayed
                expect(screen.getByRole('alert')).toHaveTextContent(
                    'Oops! Something went wrong'
                );
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(<App />);

            // Check for the search input
            const searchInput = screen.getByRole('textbox', { name: 'Search for a city' });
            expect(searchInput).toBeInTheDocument();

            // Check for the search icon button
            const searchButton = screen.getByRole('button', { name: 'Search' });
            expect(searchButton).toBeInTheDocument();
        });

        it('should maintain proper focus management', async () => {
            render(<App />);

            const user = userEvent.setup();

            // Start with focus on the document body
            document.body.focus();

            // Simulate tabbing through interactive elements
            await user.tab(); // Search icon button
            expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();

            await user.tab(); // Search input
            expect(screen.getByRole('textbox', { name: 'Search for a city' })).toHaveFocus();
        });

        it('should announce loading and error states to screen readers', async () => {
            const errorMessage = 'Network Error';

            // Mock getCities to reject with an error
            (getCities as jest.Mock).mockRejectedValue(new Error(errorMessage));

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            act(() => {
                fireEvent.change(searchInput, { target: { value: 'Paris' } });
            });

            // Wait for error message to appear
            await waitFor(() => {
                const alert = screen.getByRole('alert');
                expect(alert).toHaveTextContent(`Oops! Something went wrong: ${errorMessage}`);
            });
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            jest.clearAllMocks(); // Clear mocks before each test
        });

        it('should handle component unmount during API call', async () => {
            // Mock getCities to resolve after a delay
            (getCities as jest.Mock).mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve([
                            {
                                id: 1,
                                name: 'Test City',
                                country: 'Test Country',
                                population: 1000,
                            },
                        ]);
                    }, 1000);
                });
            });

            const { unmount } = render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');

            act(() => {
                fireEvent.change(searchInput, { target: { value: 'Test' } });
            });

            // Unmount the component before the API call completes
            unmount();

            // Wait to ensure no errors are thrown during unmount
            await waitFor(() => {
                expect(getCities).toHaveBeenCalled();
            });

            // No assertions needed; test passes if no errors are thrown
        });

        it('should handle special characters in search', async () => {
            const specialCharTerm = '!@#$%^&*()';

            // Mock getCities to resolve with empty array
            (getCities as jest.Mock).mockResolvedValue([]);

            render(<App />);

            const searchInput = screen.getByPlaceholderText('Search for a city');
            act(() => {
                fireEvent.change(searchInput, { target: { value: specialCharTerm } });
            });
            // Wait for getCities to be called with special characters
            await waitFor(() => {
                expect(getCities).toHaveBeenCalledWith({ searchTerm: specialCharTerm });
            });
        });

        it('should handle extreme viewport sizes', () => {
            // Set viewport to a small size
            global.innerWidth = 320;
            global.dispatchEvent(new Event('resize'));

            render(<App />);

            // Check that the app renders correctly on small screens
            expect(screen.getByPlaceholderText('Search for a city')).toBeInTheDocument();

            // Set viewport to a large size
            global.innerWidth = 1920;
            global.dispatchEvent(new Event('resize'));

            // Check that the app renders correctly on large screens
            expect(screen.getByPlaceholderText('Search for a city')).toBeInTheDocument();
        });
    });
});