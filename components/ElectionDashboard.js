import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
//import { doc, updateDoc, getDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

//import db from "../firebaseConfig";
import axios from 'axios';

import Button from '../components/Button';

const baseUri = 'http://10.28.135.157:3000'
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
      if (electionStatus === 'Completed') {
        await fetchElectionResults();
      }

      if (resultsAnnounced) {
        announceResults();
      }
    };

    fetchData();
  }, []);

  const findWinner = (seats) => {
    const totalSeats = seats.reduce((total, party) => total + party.seat, 0);
    const majorityThreshold = totalSeats / 2;
    const winner = seats.find((party) => party.seat > majorityThreshold);

    return winner;
  };

  const fetchElectionResults = async () => {
    try {
      const response = await fetch(`${baseUri}/gevs/results`);
      if (!response.ok) {
        throw new Error('Failed to fetch election results');
      }
      const data = await response.json();

      setElectionResults(data.seats);

      const winner = findWinner(data.seats);
      const electionOutcome = winner ? `Winner: ${winner.party}` : 'Hung Parliament';
      setElectionOutcome(electionOutcome);

      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB');
      await updateDoc(electionRef, {
        electionStatus: 'Completed',
        electionOutcome: electionOutcome,
      });
    } catch (error) {
      console.error('Error fetching election results:', error);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch(`${baseUri}/gevs/constituencyAll/all`);
      console.log("response", `${baseUri}/gevs/constituencyAll/all`)
      if (!response.ok) {
        throw new Error('Failed to fetch real-time data');
      }
      const data = await response.json();
      setRealTimeData(data);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  const fetchElectionStatus = async () => {
    try {
      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB');
      const electionDoc = await getDoc(electionRef);

      if (electionDoc.exists()) {
        setElectionStatus(electionDoc.data().electionStatus);
        setResultsAnnounced(electionDoc.data().resultsAnnounced);

        if (electionDoc.data().electionStatus === 'ongoing') {
          fetchRealTimeData();
          setShowEndButton(true);
          setShowStartButton(false);
        }

        if (electionDoc.data().resultsAnnounced) {
          setAnnounceOutcome('You have already announced the election outcome');
        }
      } else {
        console.error('Election document not found');
      }
    } catch (error) {
      console.error('Error fetching election status:', error);
    }
  };

  const startElection = async () => {
    try {
      const response = await fetch(`${baseUri}/gevs/start-election`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to start the election');
      }

      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB');
      await updateDoc(electionRef, { electionStatus: 'ongoing' });

      setShowEndButton(true);
      setShowStartButton(false);
      fetchRealTimeData();
      setElectionStatus('ongoing');
    } catch (error) {
      console.error('Error starting the election:', error);
    }
  };

  const endElection = async () => {
    try {
      const response = await fetch(`${baseUri}/gevs/end-election`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to end the election');
      }

      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB');
      await updateDoc(electionRef, { electionStatus: 'Completed' });

      setElectionStatus('Completed');
      fetchElectionResults();
    } catch (error) {
      console.error('Error ending the election:', error);
    }
  };

  const announceResults = async () => {
    try {
      let outcomeMessage = 'You have announced the election outcome';

      setAnnounceOutcome(outcomeMessage);
      setResultsAnnounced(true);

      const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB');

      await updateDoc(electionRef, {
        resultsAnnounced: true,
      });
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

      setElectionResults([]);
      setRealTimeData([]);
      setAnnounceOutcome('');
      setElectionOutcome('');
      setResultsAnnounced(false);
      setElectionStatus('');
      setShowEndButton(false);
      setShowStartButton(true);
    } catch (error) {
      console.error('Error resetting election:', error);
    }
  };

  const resetUserCollection = async () => {
    try {
      const usersCollectionRef = collection(db, 'users');
      const userDocs = await getDocs(usersCollectionRef);

      const batch = writeBatch(db)

      userDocs.forEach((userDoc) => {
        batch.update(userDoc.ref, {
          hasVoted: false,
          votedParty: '',
        });
      });

      await batch.commit();

      console.log('User collection reset successfully');
    } catch (error) {
      console.error('Error resetting user collection:', error);
    }
  };

  async function resetVoteCountForAll() {
    try {
      const constituenciesSnapshot = await getDocs(collection(db, 'constituencies'));

      const batch = writeBatch(db)

      constituenciesSnapshot.forEach((constituencyDoc) => {
        const constituencyRef = doc(db, 'constituencies', constituencyDoc.id);

        const candidates = constituencyDoc.data().candidates.map((candidate) => ({
          ...candidate,
          voteCount: 0,
        }));

        batch.update(constituencyRef, { candidates });
      });

      await batch.commit();

      console.log('Successfully reset voteCount to 0 for all candidates in all constituencies');
    } catch (error) {
      console.error('Error resetting voteCount:', error);
    }
  }

  const resetAllData = async () => {
    await resetElection();
    await resetUserCollection();
    resetVoteCountForAll();
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

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const persistedOutcome = await AsyncStorage.getItem('electionOutcome');
        const persistedResults = await AsyncStorage.getItem('electionResults');

        if (persistedOutcome) {
          setAnnounceOutcome(JSON.parse(persistedOutcome));
        }

        if (persistedResults) {
          setElectionResults(JSON.parse(persistedResults));
        }
      } catch (error) {
        console.error('Error loading persisted data:', error);
      }
    };

    loadPersistedData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Election Status: {electionStatus}</Text>
      {showStartButton && !resultsAnnounced && (
        <Button title="Start Election" onPress={startElection} />
      )}

      {showEndButton && electionStatus === 'ongoing' && (
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
                    <Text>
                      {item.party}: {item.seat} seats
                    </Text>
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
  },
});

export default ElectionDashboard;
