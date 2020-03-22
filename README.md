# Fetch

At Ad Hoc, our front-end applications often exchange JSON data with various RESTful APIs. We use modern JavaScript
to interact with these APIs and to transform their responses into a format needed by the client application. In
this project, we provide a sample API with a single endpoint, and a retrieve function to to request data from
the API and transform the response.

## Setup

**Requirements:** [NodeJS > 4](https://nodejs.org/), [yarn](https://yarnpkg.com/en/docs/install)

`yarn install` to install.

`yarn test` to run the provided unit tests.

## API

`api/managed-records.js` includes a function named `retrieve` that requests data from the `/records` endpoint, transforms the result into the format outlined below, and returns a promise that resolves with the transformed object.

Upon a successful API response, the fetched payload is transformed into an object containing the following keys:

- **ids**: An array containing the ids of all items returned from the request.
- **open**: An array containing all of the items returned from the request that have a `disposition` value of `"open"`. Add a fourth key to each item called `isPrimary` indicating whether or not the item contains a primary color (red, blue, or yellow).
- **closedPrimaryCount**: The total number of items returned from the request that have a `disposition` value of `"closed"` and contain a primary color.
- **previousPage**: The page number for the previous page of results, or `null` if this is the first page.
- **nextPage**: The page number for the next page of results, or `null` if this is the last page.
