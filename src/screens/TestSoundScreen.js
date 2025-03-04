import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { playSound, initSounds } from '../utils/sound';

const TestSoundScreen = () => {
  useEffect(() => {
    initSounds();
  }, []);

  const testSound = async (soundName) => {
    try {
      await playSound(soundName);
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste de Sons</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => testSound('notification')}
      >
        <Text style={styles.buttonText}>Tocar Som de Notificação</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => testSound('success')}
      >
        <Text style={styles.buttonText}>Tocar Som de Sucesso</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => testSound('error')}
      >
        <Text style={styles.buttonText}>Tocar Som de Erro</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9F7F1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#38D7E7',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestSoundScreen;
