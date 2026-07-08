import swaggerJsdoc from "swagger-jsdoc";

const options = {

    definition: {

        openapi: "3.0.0",

        info: {

            title: "SafeWalk API",

            version: "1.0.0",

            description:

                "API REST para la plataforma web SafeWalk"

        },

        servers: [

            {

                url: "http://localhost:3000/api"

            }

        ],

        components: {

            securitySchemes: {

                bearerAuth: {

                    type: "http",

                    scheme: "bearer",

                    bearerFormat: "JWT"

                }

            }

        },

        security: [

            {

                bearerAuth: []

            }

        ]

    },

    apis: [

        "./src/routes/*.ts"

    ]

};

export default swaggerJsdoc(options);