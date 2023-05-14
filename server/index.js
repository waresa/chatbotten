require("dotenv").config();

const { PineconeClient } = require("@pinecone-database/pinecone");
const { Configuration, OpenAIApi } = require("openai");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const ndarray = require('ndarray');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const multer = require('multer');


// Initialize Pinecone client
const pinecone = new PineconeClient();

async function initPincone() {
    await pinecone.init({
        environment: "us-east1-gcp",
        apiKey: process.env.PINECONE_API_KEY,
    });
}

//Function to cache the embeddings for the document to avoid having to calculate them every time
async function getEmbedding(document) {
    let embedding = [];

    //try catch to catch errors
    try {
        if (embeddingsCache.has(document)) {
            embedding = embeddingsCache.get(document);
        } else {
            const embs = await openai.createEmbedding({
                model: 'text-embedding-ada-002',
                input: document
            });

            if (embs.data && embs.data.data) {
                for (let i = 0; i < embs.data.data.length; i++) {
                    embedding.push(embs.data.data[i].embedding);
                }
                embeddingsCache.set(document, embedding);
            } else {
                throw new Error('Unexpected response from OpenAI API');
            }
        }
        //catch errors and log them
    } catch (error) {
        console.error(`Error in getEmbedding: ${error}`);
    }

    return embedding;
}

// Function to split the text into batches and cache the batches to avoid having to split the text every time
async function createDocumentList(text, maxChars = 500) {
    try {
        const cacheKey = `documentList:${text}`;
        let documents = cache.get(cacheKey);

        if (!documents) {
            const sentences = text.split('*');
            documents = [];

            for (const sentence of sentences) {
                if (sentence.length <= maxChars) {
                    documents.push(sentence.trim());
                }
            }

            cache.set(cacheKey, documents);
        }

        return documents;
    } catch (error) {
        console.error(`Error in createDocumentList: ${error}`);
        return []; // Return an empty array in case of an error
    }
}

// Function to extract text from a file
async function extractTextFromFile(filePath) {
    try {
        const fileExt = path.extname(filePath);

        if (fileExt === '.pdf') {
            const data = await pdf(fs.readFileSync(filePath));
            return data.text.toString();
        } else if (fileExt === '.docx') {
            const data = await mammoth.extractRawText({ path: filePath });
            return data.value.toString();
        } else if (fileExt === '.txt') {
            const data = fs.readFileSync(filePath, 'utf-8');
            return data;
        } else {
            throw new Error(`Unsupported file type: ${fileExt}`);
        }
    } catch (error) {
        console.error(`Error in extractTextFromFile: ${error}`);
        return null; // Return null in case of an error
    }
}

// Function to map embeddings to the document batches and upsert them to Pinecone 250 at a time
async function upsertEmbeddingsToPinecone(documents, embeddings) {

    const index = pinecone.Index("chatbot");

    try {

        let vectors = documents.map((doc, i) => {
            return {
                id: `vec${i}`,
                metadata: {
                    text: doc
                },
                values: embeddings[i]
            }
        })

        console.log(vectors);


        let insertBatches = [];
        while (vectors.length) {
            let batchedVectors = vectors.splice(0, 250);
            let pineconeResponse = await index.upsert({ upsertRequest: { vectors: batchedVectors, namespace: "chatbot" } });

            insertBatches.push(pineconeResponse);
        }
        console.log(insertBatches);
    } catch (error) {
        console.error(`Error in upsertEmbeddingsToPinecone: ${error}`);
    }
}

// Set up multer to handle file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/') // change 'uploads/' to your desired upload directory
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
})

const app = express();
const upload = multer({ storage: storage });


const configuration = new Configuration({
    organization: "org-sYYmLMY94sOW5iVo6SToprzN",
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

app.use(bodyParser.json());
app.use(cors());


// admin function to upload document and upsert embeddings to Pinecone
async function dataUpload() {

    try {
        // post request to /file, which is the endpoint for uploading a file and performing semantic search
        app.post("/admin", upload.single('file'), async(req, res) => {

            // Get the file name and the message from the request body
            const fileName = req.file.originalname;

            // Extract text from the PDF file
            let text = await extractTextFromFile(`uploads/${fileName}`);

            // split the text into batches and cache the batches to avoid having to split the text every time
            const documents = await createDocumentList(text);

            // Calculate the embeddings for the document batches and cache the embeddings to avoid having to calculate them every time
            const embeddings = await getEmbedding(documents);

            // Upsert the embeddings to Pinecone
            await upsertEmbeddingsToPinecone(documents, embeddings);

            res.status(200).json({
                error: 'none',
                message: 'File uploaded successfully'
            });

        })
    } catch (error) {
        console.error(`Error in dataUpload: ${error}`);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Something went wrong'
        });
    }
}


// Function to perform semantic search on a document
async function SemanticSearch() {

    try {
        // post request to /file, which is the endpoint for uploading a file and performing semantic search
        app.post("/chat", async(req, res) => {

            const index = pinecone.Index("chatbot");

            // Get the message from the request body'
            const { messages } = req.body;
            console.log(messages);

            const message = messages[[messages.length - 1]];

            console.log(message);

            // Create embedding for query
            const queryRes = await openai.createEmbedding({
                model: 'text-embedding-ada-002',
                input: [message]
            });
            const queryEmbedding = ndarray(queryRes.data.data[0]);
            const queryEmbeddingArray = queryEmbedding.data.embedding;

            //perform similarity search using Pinecone

            const queryResponse = await index.query({
                queryRequest: {
                    namespace: "chatbot",
                    topK: 5,
                    includeValues: true,
                    includeMetadata: true,
                    vector: queryEmbeddingArray,
                },
            });

            let results = [];
            // Loop through the results and push the text to the results array
            for (let i = 0; i < queryResponse.matches.length; i++) {
                results.push(queryResponse.matches[i].metadata.text);
            }

            const context = results.join('\n');

            console.log(context);

            //Answer the question by passing the results to the davinci model and asking it to answer the question
            async function answerQuestion(message, results) {
                const response = await openai.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { "role": "system", "content": `You are a IT support assistant working for the employees of the municipalities Birkenes and Lillesand in Norway. Ansewr the users question based on the context given to you here:[Avviksmelding og lukking i EQS(Rutine) handler om avviksmelding og lukking i EQS link: www.google.com, Avviksmelding og lukking i EQS(Rutine) handler om avviksmelding og lukking i EQS og kan finnes via linken: www.google.com, Ansatt - Navn: Ole Pedersen, Jobbtittel: IT-Rådgiver, kommune: Lillesand, Email: olep@gmail.com, telefon: 004799900999, : sjeff, telefopn 987 989 23${context}]. It is very important that you dont answer any question that is irrelevant to your job as a IT support!` },
                        { "role": "user", "content": "Question: Hva er jobben til Ole Pedersen og hvordan kan jeg kontakte han?" },
                        { "role": "assistant", "content": "Ole Pedersen jobber som IT-Rådgiver hos Lillesand og du kan kontakte han via mail: olep@gmail.com eller via telefon: 004799900999.", },
                        { "role": "user", "content": "Question: Hvor kan jeg finne informasjon om avviksmelding og lukking i EQS?", },
                        { "role": "assistant", "content": "Du finner informasjon om Avviksmelding og lukkings i EQS(Rutine) via denne linken: www.google.com", },
                        { "role": "user", "content": "Question: Hva er 2+2?", },
                        { "role": "assistant", "content": "Beklager, jeg kan ikke svare på spørsmål som er ikke relevant til systemet. Trenger du assistanse med noe annet, kan jeg hjelpe deg med det.", },
                        { "role": "user", "content": `Question: ${message} `, }
                    ]
                });
                return response.data.choices[0].message.content;
            }
            //Answer the question by passing the results to the davinci model and asking it to answer the question
            const response = await answerQuestion(message, results);
            console.log(response);
            res.json({
                message: response
            })
        })
    } catch (error) {
        console.error(`Error in SemanticSearch: ${error}`);
        // Send an error response to the client
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function appFunction() {
    const port = 3080;
    try {
        await initPincone();
        await dataUpload();
        await SemanticSearch();
    } catch (error) {
        console.error(`Error in appFunction: ${error}`);
    }
    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`);
    });
}


appFunction();