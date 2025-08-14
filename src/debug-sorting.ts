// Debug utility to understand sorting behavior
export const debugSortingState = (
  totalCount: number,
  isSortingGlobal: boolean,
  allCarsForSorting: any[],
  carsForSorting: any[],
  sortBy: string,
  context: string
) => {
  console.log(`🔍 [${context}] Sorting Debug:`, {
    totalCount,
    isSortingGlobal,
    allCarsForSortingLength: allCarsForSorting.length,
    carsForSortingLength: carsForSorting.length,
    sortBy,
    shouldUseGlobalSorting: totalCount > 50,
    actuallyUsingGlobalSorting: isSortingGlobal && allCarsForSorting.length > 0
  });
};