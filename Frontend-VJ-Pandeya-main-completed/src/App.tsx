import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { City } from 'api/getCities';
import { getCities } from 'api/getCities';
import SortableTable from './components/SortableTable';
import './App.css';
import { ReactComponent as Search } from './assets/Search.svg';
import useDebounce from './hooks/useDebounce';

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cities, setCities] = useState<City[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [noResults, setNoResults] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce the search term input to limit API calls; 150ms delay balances responsiveness and API usage
    const debouncedSearchTerm = useDebounce(searchTerm, 150);

    // Memoize columns configuration to avoid unnecessary re-renders
    const columns = useMemo(
        () => [
            { key: 'name', label: 'City Name', sortable: true },
            { key: 'country', label: 'Country', sortable: true },
            { key: 'population', label: 'Population', sortable: true },
        ],
        []
    );

    // Memoize the search function to prevent unnecessary re-creations
    const runSearch = useCallback(
        async (term: string) => {
            const trimmedTerm = term.trim();
            setIsPending(true);
            setError(null); // Reset error state when starting a new search
            try {
                const searchResult = await getCities({ searchTerm: trimmedTerm });
                setCities(searchResult);
                setNoResults(searchResult.length === 0);
            } catch (err: any) {
                // Using 'any' for error due to time constraints; ideally, define a proper error type
                setError(err);
            } finally {
                setIsPending(false);
            }
        },
        []
    );

    // Trigger search whenever the debounced search term changes
    useEffect(() => {
        runSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm, runSearch]);

    const onSearchTermChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.currentTarget.value);
    };

    const handleIconClick = () => {
        inputRef.current?.focus();
    };

    return (
        <div className="App">
            <header className="App-header">
                <div className="search-container">
                    {/* Using 'aria-label' to provide an accessible name for the search form */}
                    <form role="search" aria-label="City Search">
                        <label htmlFor="search" className="visually-hidden">
                            Search for a city
                        </label>
                        <div className="search-bar">
                            <button
                                type="button"
                                onClick={handleIconClick}
                                className="search-icon-button"
                                aria-label="Search"
                            >
                                <Search data-testid="search-icon" />
                            </button>
                            <input
                                ref={inputRef}
                                id="search"
                                name="search"
                                type="text"
                                placeholder="Search for a city"
                                value={searchTerm}
                                onChange={onSearchTermChange}
                            />
                        </div>
                    </form>
                </div>
            </header>
            {/* Accessible Loading Indicator */}
            {isPending && (
                // Using 'aria-live' to announce loading status to assistive technologies
                <div role="status" aria-live="polite">
                    Loading...
                </div>
            )}
            {/* Accessible Error Message */}
            {error && (
                // 'role="alert"' ensures that the error message is announced immediately
                <pre role="alert">{`Oops! Something went wrong: ${error.message}`}</pre>
            )}
            {/* Accessible No Results Message */}
            {!isPending && noResults && (
                <div role="status" aria-live="polite">
                    No cities found.
                </div>
            )}
            {!isPending && !noResults && !error && (
                <>
                    {/* Live Region for Dynamic Content Updates */}
                    <div aria-live="polite" className="visually-hidden">
                        {cities.length > 0 ? `${cities.length} cities displayed` : 'No cities found'}
                    </div>
                    <SortableTable data={cities} columns={columns} />
                </>
            )}
        </div>
    );
};

export default App;