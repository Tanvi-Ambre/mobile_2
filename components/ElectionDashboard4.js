import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet  } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { doc, writeBatch, getDoc, updateDoc, setDoc ,getDocs, collection} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from "../firebaseConfig";
import axios from 'axios';

import Button from '../components/Button'

const ElectionDashboard = ({ navigation }) => {
  const [electionStatus, setElectionStatus] = useState('Pending');
  const [electionResults, setElectionResults] = useState([]);
  const [realTimeData, setRealTimeData] = useState([]);
  const [showEndButton, setShowEndButton] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [electionOutcome, setElectionOutcome] = useState(null);
  const [resultsAnnounced, setResultsAnnounced] = useState(false);
  const [announceOutcome, setAnnounceOutcome] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        await fetchElectionStatus();
        await fetchRealTimeData();
        if(electionStatus === 'Completed'){

            await fetchElectionResults();
        }
  
        if (resultsAnnounced) {
          announceResults();
        }
      };
  
      fetchData();
    // Fetch initial election status
  }, []);
 
  console.log("announceOutcome", announceOutcome)
  
  const findWinner = (seats) => {
    // Assuming seats is an array of objects with party and seat properties
    const totalSeats = seats.reduce((total, party) => total + party.seat, 0);
    const majorityThreshold = totalSeats / 2;

    // Find the party with the majority of seats
    const winner = seats.find(party => party.seat > majorityThreshold);

    return winner;
  };

  const fetchElectionResults = async () => {
   // console.log("again")
    try {
      const response = await fetch('http://10.28.135.157:3000/gevs/results');
      if (!response.ok) {
        throw new Error('Failed to fetch election results');
      }
      const data = await response.json();
      console.log("data.seats", data.seats)
     // console.log("electionStatus",electionStatus, data.seats)
      //setElectionStatus(data.status);
      setElectionResults(data.seats);

      // Check for a winner or a "Hung Parliament"
      const winner = findWinner(data.seats);
      const electionOutcome = winner ? `Winner: ${winner.party}` : 'Hung Parliament';
      setElectionOutcome(electionOutcome);

      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB');
      await updateDoc(electionRef, {
        electionStatus: 'Completed',
        electionOutcome: electionOutcome,
      });

      /* if (winner) {
     //   console.log("are u there")
      setElectionOutcome(`Winner: ${winner.party}`);
      } else {
        setElectionOutcome('Hung Parliament');
      } */
  

    } catch (error) {
      console.error('Error fetching election results:', error);
      // Handle error or display a message to the user
    }
  };

  const fetchRealTimeData = async () => {
   // console.log("fetch")
    try {
      // Fetch real-time data for each constituency
      const response = await fetch('http://10.28.135.157:3000/gevs/constituencyAll/all');
      if (!response.ok) {
        throw new Error('Failed to fetch real-time data');
      }
      const data = await response.json();
     // console.log("data", data)
      setRealTimeData(data);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  const fetchElectionStatus = async () => {
    try {
      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB'); // Replace with the actual document ID
      const electionDoc = await getDoc(electionRef);

      if (electionDoc.exists()) {
        setElectionStatus(electionDoc.data().electionStatus);
        setResultsAnnounced(electionDoc.data().resultsAnnounced);
  
        // If the election is ongoing, fetch real-time data
        if (electionDoc.data().electionStatus === 'ongoing') {
          fetchRealTimeData();
          setShowEndButton(true);
          setShowStartButton(false);
        }
  
        // Check if results are already announced
        if (electionDoc.data().resultsAnnounced) {
          setAnnounceOutcome('You have already announced the election outcome');
        }
      } else {
        console.error('Election document not found');
      }
    }
    catch (error) {
      console.error('Error fetching election status:', error);
    }
  };


  const startElection = async () => {
    try {
      const response = await fetch('http://10.28.135.157:3000/gevs/start-election', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to start the election');
      }
      
      // Update election status in Firestore
      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB'); // Replace with the actual document ID
      await updateDoc(electionRef, { electionStatus: 'ongoing' });

      setShowEndButton(true);
      setShowStartButton(false);
      fetchRealTimeData();
      setElectionStatus('ongoing')
    } catch (error) {
      console.error('Error starting the election:', error);
    }
  };

  const endElection = async () => {
    try {
      const response = await fetch('http://10.28.135.157:3000/gevs/end-election', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to end the election');
      }

      // Update election status in Firestore
      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB'); // Replace with the actual document ID
      await updateDoc(electionRef, { electionStatus: 'Completed' });

      setElectionStatus('Completed');
      //setResultsAnnounced(true)
      fetchElectionResults();
    } catch (error) {
      console.error('Error ending the election:', error);
    }
  };

 /*  const saveResultsAnnounced = async () => {
    try {
      await AsyncStorage.setItem('resultsAnnounced', JSON.stringify(true));
      const value = await AsyncStorage.getItem('resultsAnnounced');
      console.log('Value after setItem for resultsAnnounced:', value);
      setResultsAnnounced(true);
    } catch (error) {
      console.error('Error saving resultsAnnounced:', error);
    }
  };
  
  const saveAnnounceOutcome = async () => {
    try {
      let outcomeMessage = 'You have announced the election outcome';
      await AsyncStorage.setItem('announceOutcome', outcomeMessage);
      const value = await AsyncStorage.getItem('announceOutcome');
      console.log('Value after setItem for announceOutcome:', value);
      setAnnounceOutcome(outcomeMessage);
    } catch (error) {
      console.error('Error saving announceOutcome:', error);
    }
  };
  
  
  useEffect(() => {
    console.log("are y getting called");
  
    const loadData = async () => {
      await saveResultsAnnounced();
      await saveAnnounceOutcome();
    };
  
    loadData();
  }, []); */

 /*  useEffect(() => {
    console.log("are y getting called")
    const loadResultsAnnounced = async () => {
      try {
        const value = await AsyncStorage.getItem('resultsAnnounced');
        if (value !== null) {
            console.log("loadResultsAnnounced", value)
          setResultsAnnounced(JSON.parse(value));
        }
      } catch (error) {
        console.error('Error loading resultsAnnounced:', error);
      }
    };
  
    const loadAnnounceOutcome = async () => {
        try {
            const value = await AsyncStorage.getItem('announceOutcome');
            console.log("why u not")
        console.log("not????", value)
        if (value !== null) {
            console.log("loadAnnounceOutcome---", value)
          setAnnounceOutcome(value);
        }
      } catch (error) {
        console.error('Error loading announceOutcome:', error);
      }
    };
  
    loadResultsAnnounced();
    loadAnnounceOutcome();
  }, []); */

  const announceResults = async() => {
    try {
        let outcomeMessage = 'You have announced the election outcome';

        setAnnounceOutcome(outcomeMessage);
        setResultsAnnounced(true);
    
      //  await AsyncStorage.setItem('resultsAnnounced', JSON.stringify(true));
       // await AsyncStorage.setItem('announceOutcome', outcomeMessage);
    
        // Update Firestore with resultsAnnounced status and announceOutcome
        const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB');
    
        await updateDoc(electionRef, {
          resultsAnnounced: true,
          //electionOutcome: electionOutcome,
        }, { merge: true });
      } catch (error) {
        console.error('Error announcing results:', error);
      }
  };

  const resetElection = async () => {
    try {
      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB');
      await updateDoc(electionRef, {
        electionOutcome: '',
        electionStatus: 'Pending',
        resultsAnnounced: false,
      });

      // Fetch updated election status
      //fetchElectionStatus();

      // Reset other relevant state variables if needed
        setElectionResults([]);
        setRealTimeData([]);
        setAnnounceOutcome('');
        setElectionOutcome('');
        setResultsAnnounced(false);
        setElectionStatus('');
        setShowEndButton(false);
        setShowStartButton(true);
    }
    
    catch (error) {
      console.error('Error resetting election:', error);
    }
  };

  const resetUserCollection = async () => {
    try {
      // Get all documents from the 'users' collection
      const usersCollectionRef = collection(db, 'users');
      const userDocs = await getDocs(usersCollectionRef);
  
      // Create a batch to perform multiple updates
      const batch = writeBatch(db);
  
      // Iterate over each document and update the fields
      userDocs.forEach((userDoc) => {
        batch.update(userDoc.ref, {
          hasVoted: false,
          votedParty: '',
        });
      });
  
      // Commit the batch to apply the updates
      await batch.commit();
  
      console.log('User collection reset successfully');
    } catch (error) {
      console.error('Error resetting user collection:', error);
    }
  };

  async function resetVoteCountForAll() {
    try {
      // Get all documents from the 'constituencies' collection
      const constituenciesSnapshot = await getDocs(collection(db, 'constituencies'));
  
      // Create a batch to perform multiple updates
      const batch = writeBatch(db);
  
      constituenciesSnapshot.forEach((constituencyDoc) => {
        const constituencyRef = doc(db, 'constituencies', constituencyDoc.id);
  
        const candidates = constituencyDoc.data().candidates.map(candidate => ({
          ...candidate,
          voteCount: 0,
        }));
  
        // Update the candidates array in the Firestore document
        batch.update(constituencyRef, { candidates });
      });
  
      // Commit the batch to apply the updates
      await batch.commit();
  
      console.log('Successfully reset voteCount to 0 for all candidates in all constituencies');
    } catch (error) {
      console.error('Error resetting voteCount:', error);
    }
  }
  
  // Call the resetConstituencies function when needed
  // resetConstituencies();
  
  
  // Call the resetConstituencies function when needed
  // resetConstituencies();
  
  const resetAllData = async () => {
    await resetElection();
    await resetUserCollection();
    resetVoteCountForAll();
    //await resetConstituencies();
    
  };

  const renderConstituencyCard = ({ item }) => (
    <Card key={item.constituency} style={styles.constituencyCard}>
      <Card.Content>
        <Title>{item.constituency}</Title>
        <FlatList
          data={item.result}
          renderItem={({ item }) => (
            <Paragraph>
              {item.party}: {item.vote} votes
            </Paragraph>
          )}
          keyExtractor={(item, index) => `${item.party}-${index}`}
        />
      </Card.Content>
    </Card>
  );
  console.log("electionOutcome", electionOutcome)
  console.log("announceOutcome", announceOutcome)
  console.log("electionStatus", electionStatus)

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Election Status: {electionStatus}</Text>
      {showStartButton && !resultsAnnounced && (
        <Button title="Start Election"  onPress={startElection} />
      )}

      {showEndButton && electionStatus === 'ongoing'&& (
        <Button title="End Election" onPress={endElection} />
      )}

      {electionStatus === 'ongoing' && (
        <>
          <Text style={styles.resultsHeading}>Real-Time Election Results</Text>
          <FlatList
            data={realTimeData}
            renderItem={renderConstituencyCard}
            keyExtractor={(item) => item.constituency}
            ListHeaderComponent={<View />}
            ListHeaderComponentStyle={{ marginBottom: 16 }}
          />
        </>
      )}

      {electionStatus === 'Completed' && (
        <View style={styles.results}>
          <Text style={styles.resultsHeading}>Final Election Results</Text>
          {electionOutcome && (
            <Text style={styles.outcome}>{electionOutcome}</Text>
          )}
          {announceOutcome && (
            <Text style={styles.outcome}>{announceOutcome}</Text>
          )}
          <Card style={styles.constituencyCard}>
            <Card.Content>
              <FlatList
                data={electionResults}
                renderItem={({ item }) => (
                  <View style={styles.resultItem}>
                    <Text>{item.party}: {item.seat} seats</Text>
                  </View>
                )}
                keyExtractor={(item, index) => `${item.party}-${index}`}
              />
            </Card.Content>
          </Card>
        </View>
      )}

      {!resultsAnnounced && electionStatus === 'Completed' && (
        <Button title="Announce Results" onPress={announceResults} />
      )}

      {resultsAnnounced && electionStatus === 'Completed' && (
         <Button title="Reset Election Data" onPress={resetAllData} />

      )}

      <Button title="Logout" onPress={() => navigation.navigate('Login')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  status: {
    fontSize: 18,
    marginBottom: 16,
  },
  outcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 16,
  },
  results: {
    marginTop: 16,
  },
  resultsHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultItem: {
    marginBottom: 8,
  },
  constituencyCard: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  }
});

export default ElectionDashboard;