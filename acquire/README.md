# Acquiring date for usage in analytics
This folder is for acquiring the raw data to be used in Alkemio analytics.

It is at the moment a manual process: the GraphQL queries to be run are saved and need to be run using the Graphql Playground e.g. `https://alkem.io/graphql`

## To do
A clear next step it to automate the retrieval of the data using the GraphQL queries specified. This is likely to be using the `@alkemio/client-lib` package to authenticate and then retrieve the authentication header for usage with direct http requests.