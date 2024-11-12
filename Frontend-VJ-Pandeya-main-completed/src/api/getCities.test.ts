import { getCities } from './getCities';
import { cities } from 'data/worldcities/cities';
import type { City } from './getCities';
import type { CityRaw } from 'data/worldcities/cities';

describe('getCities', () => {
    describe('Basic Functionality', () => {
        it('should return cities with default parameters', async () => {
          const result = await getCities();
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBeGreaterThan(0);
        });
    
        it('should return correct city object structure', async () => {
          const [city] = await getCities({ limit: 1 });
          expect(city).toHaveProperty('id');
          expect(city).toHaveProperty('name');
          expect(city).toHaveProperty('nameAscii');
          expect(city).toHaveProperty('country');
          expect(city).toHaveProperty('countryIso3');
          expect(city).toHaveProperty('capital');
          expect(city).toHaveProperty('population');
          expect(typeof city.id).toBe('number');
          expect(typeof city.name).toBe('string');
          expect(typeof city.nameAscii).toBe('string');
          expect(typeof city.country).toBe('string');
          expect(typeof city.countryIso3).toBe('string');
          expect(typeof city.capital).toBe('string');
          expect(typeof city.population).toBe('number');
        });
    
        it('should respect the default limit of 10000', async () => {
          const result = await getCities();
          expect(result.length).toBeLessThanOrEqual(10000);
        });
    
        it('should handle empty cities data gracefully', async () => {
          // Temporarily override the cities data
          const originalCities = [...cities];
          try {
            // Empty the cities array
            (cities as any).length = 0;
            const result = await getCities();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
          } finally {
            // Restore the original cities data
            cities.push(...originalCities);
          }
        });
      });

      describe('Pagination', () => {
        it('should return correct number of results when limit is specified', async () => {
          const limit = 5;
          const result = await getCities({ limit });
          expect(result.length).toBe(limit);
        });
    
        it('should skip correct number of results when offset is specified', async () => {
          const limit = 5;
          const offset = 10;
          const resultWithOffset = await getCities({ limit, offset });
          const resultWithoutOffset = await getCities({ limit: limit + offset });
          const expectedResult = resultWithoutOffset.slice(offset);
    
          expect(resultWithOffset).toEqual(expectedResult);
        });
    
        it('should handle offset larger than available data', async () => {
          const offset = cities.length + 10; // Offset beyond data length
          const result = await getCities({ offset });
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(0);
        });
    
        it('should handle limit larger than available data', async () => {
          const limit = cities.length + 1000; // Limit beyond data length
          const result = await getCities({ limit });
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(cities.length);
        });
    
        it('should throw error for negative offset', async () => {
          const offset = -5;
          await expect(getCities({ offset })).rejects.toThrow(
            'Offset must be non-negative, and limit must be greater than 0.'
          );
        });
    
        it('should throw error for zero or negative limit', async () => {
          const limitZero = 0;
          const limitNegative = -10;
    
          await expect(getCities({ limit: limitZero })).rejects.toThrow(
            'Offset must be non-negative, and limit must be greater than 0.'
          );
    
          await expect(getCities({ limit: limitNegative })).rejects.toThrow(
            'Offset must be non-negative, and limit must be greater than 0.'
          );
        });
      });

      describe('Search Functionality', () => {
        it('should filter cities by city name', async () => {
          const searchTerm = 'Berlin';
          const result = await getCities({ searchTerm });
          expect(result.length).toBeGreaterThan(0);
    
          result.forEach((city) => {
            const nameMatches = city.name.toLowerCase().includes(searchTerm.toLowerCase());
            expect(nameMatches).toBe(true);
          });
        });
    
        it('should filter cities by country name', async () => {
          const searchTerm = 'Germany';
          const result = await getCities({ searchTerm });
          expect(result.length).toBeGreaterThan(0);
    
          result.forEach((city) => {
            const countryMatches = city.country.toLowerCase().includes(searchTerm.toLowerCase());
            expect(countryMatches).toBe(true);
          });
        });
    
        it('should handle case-insensitive search', async () => {
          const searchTerm = 'paris';
          const result = await getCities({ searchTerm });
          expect(result.length).toBeGreaterThan(0);
    
          result.forEach((city) => {
            const nameMatches = city.name.toLowerCase().includes(searchTerm.toLowerCase());
            const countryMatches = city.country.toLowerCase().includes(searchTerm.toLowerCase());
            expect(nameMatches || countryMatches).toBe(true);
          });
        });
    
        it('should handle whitespace in search terms', async () => {
          const searchTerm = '   Tokyo   ';
          const trimmedSearchTerm = searchTerm.trim().toLowerCase();
          const result = await getCities({ searchTerm });
          expect(result.length).toBeGreaterThan(0);
    
          result.forEach((city) => {
            const nameMatches = city.name.toLowerCase().includes(trimmedSearchTerm);
            const countryMatches = city.country.toLowerCase().includes(trimmedSearchTerm);
            expect(nameMatches || countryMatches).toBe(true);
          });
        });
    
        it('should handle empty search term', async () => {
          const result = await getCities({ searchTerm: '' });
          expect(result.length).toBeGreaterThan(0);
          // Optionally, verify that all cities are returned up to the default limit
          expect(result.length).toBeLessThanOrEqual(10000);
        });
    
        it('should handle search term with special characters', async () => {
          const searchTerm = 'São Paulo';
          const result = await getCities({ searchTerm });
          expect(result.length).toBeGreaterThan(0);
    
          result.forEach((city) => {
            const nameMatches = city.name.toLowerCase().includes(searchTerm.toLowerCase());
            const countryMatches = city.country.toLowerCase().includes(searchTerm.toLowerCase());
            expect(nameMatches || countryMatches).toBe(true);
          });
        });
    
        it('should return empty array for non-matching search term', async () => {
          const searchTerm = 'NonExistentCity12345';
          const result = await getCities({ searchTerm });
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(0);
        });
      });

      describe('Data Transformation', () => {
        it('should correctly transform raw city data to City type', async () => {
          const limit = 5;
          const result = await getCities({ limit });
    
          // Manually transform the first 'limit' cities using the same logic as getCities
          const expectedCities = cities.slice(0, limit).map((row: CityRaw) => ({
            id: row[0],
            name: row[1],
            nameAscii: row[2],
            country: row[3],
            countryIso3: row[4],
            capital: row[5],
            population: row[6],
          }));
    
          expect(result).toEqual(expectedCities);
        });
    
        it('should preserve numeric values in population field', async () => {
          const limit = 5;
          const result = await getCities({ limit });
    
          result.forEach((city, index) => {
            const originalPopulation = cities[index][6]; // Original population value
            expect(city.population).toBe(originalPopulation);
            expect(typeof city.population).toBe('number');
          });
        });
    
        it('should maintain correct data types for all fields', async () => {
          const limit = 5;
          const result = await getCities({ limit });
    
          result.forEach((city) => {
            expect(typeof city.id).toBe('number');
            expect(typeof city.name).toBe('string');
            expect(typeof city.nameAscii).toBe('string');
            expect(typeof city.country).toBe('string');
            expect(typeof city.countryIso3).toBe('string');
            expect(typeof city.capital).toBe('string');
            expect(typeof city.population).toBe('number');
          });
        });
      });

      describe('Edge Cases', () => {
        it('should handle unicode characters in city names', async () => {
          // Find a city with unicode characters in its name
          const unicodeCity = cities.find((cityRaw) => /[^\u0000-\u007F]/.test(cityRaw[1]));
          if (!unicodeCity) {
            throw new Error('No cities with unicode characters found in the dataset.');
          }
    
          const searchTerm = unicodeCity[1];
          const result = await getCities({ searchTerm });
    
          expect(result.length).toBeGreaterThan(0);
    
          result.forEach((city) => {
            const nameMatches = city.name.includes(searchTerm);
            expect(nameMatches).toBe(true);
          });
        });
    
        it('should handle extremely long city or country names', async () => {
          // Find the longest city and country names
          const longestCityName = cities.reduce((longest, cityRaw) => {
            return cityRaw[1].length > longest.length ? cityRaw[1] : longest;
          }, '');
    
          const longestCountryName = cities.reduce((longest, cityRaw) => {
            return cityRaw[3].length > longest.length ? cityRaw[3] : longest;
          }, '');
    
          // Test with the longest city name
          let result = await getCities({ searchTerm: longestCityName });
          expect(result.length).toBeGreaterThan(0);
          result.forEach((city) => {
            expect(city.name).toBe(longestCityName);
          });
    
          // Test with the longest country name
          result = await getCities({ searchTerm: longestCountryName });
          expect(result.length).toBeGreaterThan(0);
          result.forEach((city) => {
            expect(city.country).toBe(longestCountryName);
          });
        });
    
        it('should handle minimum and maximum population values', async () => {
          // Find cities with minimum and maximum population
          const populations = cities.map((cityRaw) => cityRaw[6]);
          const minPopulation = Math.min(...populations);
          const maxPopulation = Math.max(...populations);
    
          // Fetch city with minimum population
          let result = await getCities();
          let cityWithMinPopulation = result.find((city) => city.population === minPopulation);
          expect(cityWithMinPopulation).toBeDefined();
          expect(cityWithMinPopulation?.population).toBe(minPopulation);
    
          // Fetch city with maximum population
          let cityWithMaxPopulation = result.find((city) => city.population === maxPopulation);
          expect(cityWithMaxPopulation).toBeDefined();
          expect(cityWithMaxPopulation?.population).toBe(maxPopulation);
        });
      });
    
      describe('Error Handling', () => {
        
    
        it('should provide meaningful error messages', async () => {
          // Negative offset
          await expect(getCities({ offset: -1 })).rejects.toThrow(
            'Offset must be non-negative, and limit must be greater than 0.'
          );
    
          // Zero limit
          await expect(getCities({ limit: 0 })).rejects.toThrow(
            'Offset must be non-negative, and limit must be greater than 0.'
          );
    
          // Negative limit
          await expect(getCities({ limit: -5 })).rejects.toThrow(
            'Offset must be non-negative, and limit must be greater than 0.'
          );
        });
      });
});