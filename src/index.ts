import { ApolloServer } from 'apollo-server-express'
import dotenv from 'dotenv'
import express from 'express'
import { GraphQLSchema } from 'graphql'
import { constraintDirective } from 'graphql-constraint-directive'
import neo4j from 'neo4j-driver'
import { makeAugmentedSchema } from 'neo4j-graphql-js'
import 'reflect-metadata'
import { typeDefs } from './graphql-schema'

dotenv.config()

const main = async() => {
    
    const app = express()

    let schema: GraphQLSchema = await makeAugmentedSchema({
        typeDefs: typeDefs,
        schemaTransforms: [constraintDirective()]
    })

    console.log(schema) // errors?
    console.log("process.env.NEO4J_URI", process.env.NEO4J_URI)
    
    const driver = neo4j.driver(
        process.env.NEO4J_URI || 'bolt://localhost:7687',
        neo4j.auth.basic(
          process.env.NEO4J_USER || 'neo4j',
          process.env.NEO4J_PASSWORD || 'neo4j'
        )
    )

    const formatError = function(error) {
        if (error.originalError && error.originalError.code === 'ERR_GRAPHQL_CONSTRAINT_VALIDATION') {
            // return a custom object
        }
        
        return error
    }

    // assertSchema({ schema, driver, debug: true, dropExisting: true });

    const apolloServer = new ApolloServer({
        schema: schema,
        context: ({req}) => {
            return{
                driver,
                req
            }
        },
        introspection: true,
        playground: true,
        formatError
    })

    apolloServer.applyMiddleware({ 
        app,
        cors: false
    })

    app.listen(4000, () => {
        console.log(`server started on ${process.env.NEO4J_URI || 'bolt://localhost:7687'}`)
    })
}

main().catch((err) => {
    console.error(err)
})
