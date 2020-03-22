import fetch from '../util/fetch-fill';
import URI from 'urijs';

/**
 * Record color.
 *
 * @typedef {'red'|'brown'|'blue'|'green'|'yellow'|'green'} RecordColor
 */

/**
 * Record disposition.
 *
 * @typedef {'open'|'closed'} RecordDisposition
 */

/**
 * Record item.
 *
 * @typedef Record
 *
 * @property {number}            id          ID of item.
 * @property {RecordColor}       color       One of "red", "brown", "blue",
 *                                           "yellow", or "green".
 * @property {RecordDisposition} disposition Either "open" or "closed"
 */

/**
 * Record item, including an extra key to each item isPrimary indicating whether
 * or not the item contains a primary color (red, blue, or yellow).
 *
 * @typedef {Record&{isPrimary:boolean}} RecordIsPrimary
 */

/**
 * Options supported by retrieve function.
 *
 * @typedef RetrieveOptions
 *
 * @property {number}   page   Page to retrieve.
 * @property {string[]} colors Colors to retrieve.
 */

/**
 * Object returned by retrieve function.
 *
 * @typedef RetrieveResult
 *
 * @property {number[]}          ids                Array containing the ids of
 *                                                  all items returned from the
 *                                                  request.
 * @property {RecordIsPrimary[]} open               Array containing all of the
 *                                                  items returned from the
 *                                                  request that have a
 *                                                  disposition value of "open".
 *                                                  Includes a fourth key on
 *                                                  each item called isPrimary
 *                                                  indicating whether or not
 *                                                  the item contains a primary
 *                                                  color (red, blue, yellow).
 * @property {number}            closedPrimaryCount The total number of items
 *                                                  returned from the request
 *                                                  that have a disposition
 *                                                  value of "closed" and
 *                                                  contain a primary color.
 * @property {number?}           previousPage       Page number for the previous
 *                                                  page of results, or null if
 *                                                  this is the first page.
 * @property {number?}           nextPage           Page number for the next
 *                                                  page of results, or null if
 *                                                  this is the last page.
 */

/**
 * URL of records endpoint.
 *
 * @type {string}
 */
window.path = 'http://localhost:3000/records';

/**
 * Default options to use for retrieval when omitted.
 *
 * @type {RetrieveOptions}
 */
const DEFAULT_OPTIONS = {
	page: 1,
	colors: [],
};

/**
 * Number of items to retrieve per page of items.
 *
 * @type {number}
 */
const ITEMS_PER_PAGE = 10;

/**
 * Primary colors.
 *
 * @type {Set<RecordColor>}
 */
const PRIMARY_COLORS = new Set(['red', 'blue', 'yellow']);

/**
 * Returns true if the given item is a primary color, or false otherwise.
 *
 * @param {Record} item Record item to test.
 *
 * @return {boolean} Whether item is a primary color.
 */
function isPrimaryColor(item) {
	return PRIMARY_COLORS.has(item.color);
}

/**
 * Given a disposition to test, returns a new function which, given an item,
 * returns true if the item has a matching disposition.
 *
 * @param {RecordDisposition} disposition Disposition to match.
 *
 * @return {(item:Record)=>boolean} Function testing whether item has
 *                                  disposition.
 */
function createIsDisposition(disposition) {
	return (item) => item.disposition === disposition;
}

/**
 * Given a record item, returns a transformed record item including an isPrimary
 * value corresponding to whether the item contains a primary color.
 *
 * @param {Record} item Record item to transform.
 *
 * @return {RecordIsPrimary} Transformed item.
 */
function mapRecordToRecordIsPrimary(item) {
	return { ...item, isPrimary: isPrimaryColor(item) };
}

/**
 * Given a page, returns the offset to use as limit parameter of request.
 *
 * @param {number} page Page.
 *
 * @return {number} Page offset.
 */
function getPageOffset(page) {
	return (page - 1) * ITEMS_PER_PAGE;
}

/**
 * Given a page number, returns the page number for the previous page of
 * results, or null if the page is the first page.
 *
 * @param {number} page Current page.
 *
 * @return {number?} Page number for the previous page of results, or null if
 *                   given page is the first page.
 */
function getPreviousPage(page) {
	return page === 1 ? null : page - 1;
}

/**
 * Given a page number, returns the page number for the next page of results,
 * or null if the page is the last page.
 *
 * @param {number}   page          Current page.
 * @param {Record[]} responseItems Full set of response records, before sliced
 *                                 to current page of results.
 *
 * @return {number?} Page number for the next page of results, or null if
 *                   given page is the last page.
 */
function getNextPage(page, responseItems) {
	return responseItems.length > ITEMS_PER_PAGE ? page + 1 : null;
}

/**
 * Given an array of record items, returns a new array constrained to the
 * maximum number of response items expected per page.
 *
 * @param {Record[]} items Record items.
 *
 * @return {Record[]} Record items, limited to page maximum.
 */
function getPageLimitedRecords(items) {
	return items.slice(0, ITEMS_PER_PAGE);
}

/**
 * Given an options object, returns the URL to use for retrieval.
 *
 * @param {RetrieveOptions} options Options object.
 *
 * @return {string} Retrieval URL.
 */
function getURLByOptions(options) {
	const { page, colors } = options;

	return URI(window.path)
		.search({
			// Retrieve one extra item to use in determining whether a next page
			// exists.
			limit: ITEMS_PER_PAGE + 1,
			offset: getPageOffset(page),
			'color[]': colors,
		})
		.toString();
}

/**
 * Requests data from the records endpoint, transforms the result, and returns a
 * promise that resolves with the transformed object.
 *
 * @param {Partial<RetrieveOptions>=} options Optional request options.
 *
 * @return {Promise<RetrieveResult|undefined>} Promise resolving with
 *                                             transformed object, or undefined
 *                                             if the request could not be
 *                                             completed.
 */
export default async function retrieve(options) {
	// Merge options with default to account for omitted values.
	/** @type {RetrieveOptions} */
	const mergedOptions = {
		...DEFAULT_OPTIONS,
		...options,
	};

	/** @type {Response} */
	let response;
	try {
		response = await fetch(getURLByOptions(mergedOptions));
	} catch {
		console.log('The fetch request could not be completed.');
		return;
	}

	if (!response.ok) {
		console.log('The fetch request was not successful.');
		return;
	}

	/** @type {Record[]} */
	const responseItems = await response.json();

	const records = getPageLimitedRecords(responseItems);

	return {
		ids: records.map((item) => item.id),
		open: records
			.filter(createIsDisposition('open'))
			.map(mapRecordToRecordIsPrimary),
		closedPrimaryCount: records
			.filter(createIsDisposition('closed'))
			.filter(isPrimaryColor).length,
		previousPage: getPreviousPage(mergedOptions.page),
		nextPage: getNextPage(mergedOptions.page, responseItems),
	};
}
