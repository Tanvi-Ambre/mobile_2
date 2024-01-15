import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';

const ElectionDashboard = ({ navigation }) => {
  const [electionStatus, setElectionStatus] = useState('Pending');
  const [electionResults, setElectionResults] = useState([]);

  useEffect(() => {
    fetchElectionResults();
  }, []);

  const fetchElectionResults = async () => {
    try {
      const response = await fetch('http://10.28.135.157:3000/gevs/results');
      if (!response.ok) {
        throw new Error('Failed to fetch election results');
      }
      const data = await response.json();
      //console.log("electionStatus",electionStatus)
      setElectionStatus(data.status);
      setElectionResults(data.seats);

      
    } catch (error) {
      console.error('Error fetching election results:', error);
      // Handle error or display a message to the user
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
      // Optionally, update the local state or show a success message
    } catch (error) {
      console.error('Error starting the election:', error);
      // Handle error or display a message to the user
    }
  };

 // console.log("electionStatus",electionStatus)

  const endElection = async () => {
    try {
      console.log("hi")
      const response = await fetch('http://10.28.135.157:3000/gevs/end-election', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to end the election');
      }
      // Optionally, update the local state or show a success message
    } catch (error) {
      console.error('Error ending the election:', error);
      // Handle error or display a message to the user
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Election Commission Dashboard</Text>
      <Text style={styles.status}>Election Status: {electionStatus}</Text>

      {electionResults.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultsHeading}>Election Results</Text>
          <FlatList
            data={electionResults}
            renderItem={({ item }) => (
              <View style={styles.resultItem}>
                <Text>{item.party}: {item.seat} seats</Text>
              </View>
            )}
            keyExtractor={(item, index) => `${item.party}-${index}`}
          />
        </View>
      )}

{electionStatus === 'Pending' && (
        <Button title="Start Election" onPress={startElection} />
      )}

      {electionStatus === 'Completed' && (
        <Button title="End Election" onPress={endElection} />
      )}

      <Button title="Logout" onPress={() => navigation.navigate('Login')} />
    </View>
  );
};

const styles = StyleSheet.create({
  // Define your styles here
});

export default ElectionDashboard;
