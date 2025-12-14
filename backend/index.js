const express = require('express');
const app = express();
const cors = require('cors');
const port = 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


app.use(express.json());
app.use(cors());






const uri = "mongodb+srv://birm2476:birm2476@cluster0.cqkzp8h.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const database = client.db('raffle_draw');
    const participantsCollection = database.collection('participants');
    const winnersCollection = database.collection('winners');

    app.get('/participants', async (req, res) => {
      const cursor = participantsCollection.find();
      const participants = await cursor.toArray();
      res.send(participants);
    });

    // Move a participant to winners collection and remove from participants
    app.post('/winners', async (req, res) => {
      try {
        const body = req.body || {};
        const { _id, ID } = body;
        const { ObjectId } = require('mongodb');

        let query = {};
        if (_id) {
          try {
            query = { _id: new ObjectId(_id) };
          } catch (e) {
            return res.status(400).send({ error: 'Invalid _id' });
          }
        } else if (ID) {
          query = { ID: ID };
        } else {
          return res.status(400).send({ error: 'Provide _id or ID to identify participant' });
        }

        const participant = await participantsCollection.findOne(query);
        if (!participant) return res.status(404).send({ error: 'Participant not found' });

        // Prepare winner doc (preserve original fields)
        const winnerDoc = { ...participant };

        await winnersCollection.insertOne(winnerDoc);
        await participantsCollection.deleteOne({ _id: participant._id });

        res.send({ success: true, winner: winnerDoc });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error moving participant to winners', err);
        res.status(500).send({ error: 'Server error' });
      }
    });

    app.get('/winners', async (req, res) => {
      try {
        const cursor = winnersCollection.find();
        const winners = await cursor.toArray();
        res.send(winners);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching winners', err);
        res.status(500).send({ error: 'Server error' });
      }
    });

    // Reset winners: move all winners back into participants and clear the winners collection
    app.post('/winners/reset', async (req, res) => {
      try {
        const allWinners = await winnersCollection.find().toArray();
        if (!allWinners.length) return res.send({ success: true, moved: 0 });

        // Strip _id so we can insert into participants without conflict
        const docsToInsert = allWinners.map((w) => {
          const copy = { ...w };
          delete copy._id;
          return copy;
        });

        const insertResult = await participantsCollection.insertMany(docsToInsert);
        const deleteResult = await winnersCollection.deleteMany({});

        res.send({ success: true, moved: insertResult.insertedCount, deleted: deleteResult.deletedCount });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error resetting winners', err);
        res.status(500).send({ error: 'Server error' });
      }
    });

    








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);











app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});