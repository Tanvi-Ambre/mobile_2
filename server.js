const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./credentials/serviceAccountKey.json'); // Replace with your service account key


const app = express();
const PORT = 3000;
var cors = require('cors');
app.use(cors({origin: true, credentials: true}));

// Initialize Firebase Admin SDK
const firebaseConfig = {
    credential: admin.credential.cert(serviceAccount),
    //databaseURL: 'https://your-project-id.firebaseio.com', // Replace with your Firestore database URL
  };
  
  admin.initializeApp(firebaseConfig);
  const db = admin.firestore();
  
  //Endpoint to show results
  app.get('/gevs/results', async (req, res) => {
    try {
      const constituenciesSnapshot = await db.collection('constituencies').get();
  
      const totalSeats = {}; // Object to store total seats won by each party
  
      constituenciesSnapshot.forEach((constituencyDoc) => {
        const candidates = constituencyDoc.data().candidates;
  
        candidates.forEach((candidate) => {
          // Sum up the votes for each party across all constituencies
          if (!totalSeats[candidate.party]) {
            totalSeats[candidate.party] = 0;
          }
          totalSeats[candidate.party] += parseInt(candidate.voteCount, 10);
        });
      });
  
      // Determine the winning party with maximum seats or handle hung parliament scenario
      let winner = '';
      let maxSeats = 0;
  
      Object.entries(totalSeats).forEach(([party, seats]) => {
        if (seats > maxSeats) {
          maxSeats = seats;
          winner = party;
        }
      });
  
      // Prepare the JSON response
      const jsonResponse = {
        status: 'Completed',
        winner: winner,
        seats: Object.entries(totalSeats).map(([party, seat]) => ({ party, seat })),
      };
  
      // Send the JSON response
      res.json(jsonResponse);
    } catch (error) {
      console.error('Error fetching election results:', error);
      res.status(500).json({ error: 'Error fetching election results' });
    }
  });
  
  // Endpoint to handle GET request for constituency data
  app.get('/gevs/constituency/:constituencyName', async (req, res) => {
    const requestedConstituency = req.params.constituencyName;
  
    try {
      // Retrieve data from Firestore for the requested constituency
      const docRef = db.collection('constituencies').doc(requestedConstituency);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        res.status(404).json({ error: 'Constituency not found' });
        return;
      }
  
      // Extract the candidates array from the Firestore document
      const candidates = doc.data().candidates;
  console.log("candidates",candidates)
      // Process candidates array to get the required response format
      const result = candidates.map(candidate => ({
        name: candidate.name,
        party: candidate.party,
        vote: candidate.voteCount.toString(), // Convert voteCount to string as specified in the desired response
      }));
  
      const responseData = {
        constituency: requestedConstituency,
        result: result,
      };
  
      console.log("responseData", responseData)
      res.json(responseData);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching data' });
    }
  });
  
  // Endpoint to start the election
/* app.post('/gevs/start-election', async (req, res) => {
  try {
    // Update the electionStatus field in your Firestore document to 'ongoing'
    const electionRef = db.collection('election').doc('your-document-id'); // replace 'your-document-id' with the actual document ID
    await electionRef.update({ electionStatus: 'ongoing' });

    res.json({ status: 'Election started successfully' });
  } catch (error) {
    console.error('Error starting the election:', error);
    res.status(500).json({ error: 'Error starting the election' });
  }
}); */

// Endpoint to end the election
/* app.post('/gevs/end-election', async (req, res) => {
  try {
    // Update the electionStatus field in your Firestore document to 'completed'
    const electionRef = db.collection('election').doc('hJ05mQy9V3HHWlm4gamB'); // replace 'your-document-id' with the actual document ID
    await electionRef.update({ electionStatus: 'completed' });

    res.json({ status: 'Election ended successfully' });
  } catch (error) {
    console.error('Error ending the election:', error);
    res.status(500).json({ error: 'Error ending the election' });
  }
}); */

// Endpoint to start the election
app.post('/gevs/start-election', async (req, res) => {
  try {
    // Update the electionStatus field in your Firestore document to 'ongoing'
    const electionRef = db.collection('election').doc('hJ05mQy9V3HHWlm4gamB'); // replace 'your-document-id' with the actual document ID
    
    const doc = await electionRef.get();
    if(doc.exists){
      await electionRef.update({ electionStatus: 'ongoing' });

      res.json({ status: 'Election started successfully' });
    }
    
  } catch (error) {
    console.error('Error starting the election:', error);
    res.status(500).json({ error: 'Error starting the election' });
  }
});

// Endpoint to end the election
app.post('/gevs/end-election', async (req, res) => {
  try {
    // Update the electionStatus field in your Firestore document to 'completed'
    const electionRef = db.collection('election').doc('hJ05mQy9V3HHWlm4gamB'); // replace 'your-document-id' with the actual document ID
    await electionRef.update({ electionStatus: 'completed' });

    res.json({ status: 'Election ended successfully' });
  } catch (error) {
    console.error('Error ending the election:', error);
    res.status(500).json({ error: 'Error ending the election' });
  }
});

// Endpoint to handle GET request for real-time data for all constituencies
app.get('/gevs/constituencyAll/all', async (req, res) => {
  console.log("check")
  try {
    const constituenciesSnapshot = await db.collection('constituencies').get();

    const realTimeData = []; // Array to store real-time data for all constituencies

    constituenciesSnapshot.forEach((constituencyDoc) => {
      const candidates = constituencyDoc.data().candidates;

      const result = candidates.map(candidate => ({
        name: candidate.name,
        party: candidate.party,
        vote: candidate.voteCount.toString(),
      }));

      const constituencyData = {
        constituency: constituencyDoc.id, // Assuming the constituency name is the document ID
        result: result,
      };

      realTimeData.push(constituencyData);
    });

    res.json(realTimeData);
  } catch (error) {
    console.error('Error fetching real-time data for all constituencies:', error);
    res.status(500).json({ error: 'Error fetching real-time data for all constituencies' });
  }
});

// Endpoint to reset vote counts for all candidates in all constituencies
app.post('/gevs/reset-vote-counts', async (req, res) => {
  try {
    const constituenciesSnapshot = await db.collection('constituencies').get();

    const batch = db.batch();

    constituenciesSnapshot.forEach((constituencyDoc) => {
      const candidates = constituencyDoc.data().candidates;

      candidates.forEach((candidate, index) => {
        const candidateRef = db.collection('constituencies')
          .doc(constituencyDoc.id)
          .collection('candidates')
          .doc(index.toString());

        // Reset the 'voteCount' field to 0
        batch.update(candidateRef, { voteCount: 0 });
      });
    });

    // Commit the batch to apply the updates
    await batch.commit();

    res.json({ status: 'Vote counts reset successfully' });
  } catch (error) {
    console.error('Error resetting vote counts:', error);
    res.status(500).json({ error: 'Error resetting vote counts' });
  }
});

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

