import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const CalendarScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);

  const loadTasks = async () => {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const tasksData = [];
      const marked = {};

      querySnapshot.forEach((doc) => {
        const task = { id: doc.id, ...doc.data() };
        tasksData.push(task);

        // Formata a data para o formato YYYY-MM-DD
        const date = task.dueDate.toDate();
        const dateString = date.toISOString().split('T')[0];

        // Define as cores dos pontos baseado na prioridade
        const dots = [{
          color: task.completed ? '#4CAF50' : 
                 task.priority === 'high' ? '#EE316B' :
                 task.priority === 'medium' ? '#FF9800' : '#38D7E7'
        }];

        // Adiciona ou atualiza os pontos para esta data
        if (marked[dateString]) {
          marked[dateString].dots = [...marked[dateString].dots, ...dots];
        } else {
          marked[dateString] = {
            dots,
            marked: true
          };
        }
      });

      setTasks(tasksData);
      setMarkedDates(marked);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    const tasksForDay = tasks.filter(task => {
      const taskDate = task.dueDate.toDate().toISOString().split('T')[0];
      return taskDate === day.dateString;
    });
    setSelectedTasks(tasksForDay);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#EE316B';
      case 'medium':
        return '#FF9800';
      default:
        return '#4CAF50';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38D7E7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendário</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <Calendar
          style={styles.calendar}
          theme={{
            backgroundColor: '#FFF',
            calendarBackground: '#FFF',
            textSectionTitleColor: '#666',
            selectedDayBackgroundColor: '#38D7E7',
            selectedDayTextColor: '#FFF',
            todayTextColor: '#38D7E7',
            dayTextColor: '#333',
            textDisabledColor: '#B0B0B0',
            dotColor: '#38D7E7',
            selectedDotColor: '#FFF',
            arrowColor: '#38D7E7',
            monthTextColor: '#333',
            indicatorColor: '#38D7E7',
          }}
          markingType={'multi-dot'}
          markedDates={markedDates}
          onDayPress={onDayPress}
        />

        {selectedDate && (
          <View style={styles.tasksSection}>
            <Text style={styles.sectionTitle}>
              Tarefas para {new Date(selectedDate).toLocaleDateString('pt-BR')}
            </Text>
            {selectedTasks.length > 0 ? (
              selectedTasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItem, { borderLeftColor: getPriorityColor(task.priority) }]}
                  onPress={() => navigation.navigate('EditTask', { taskId: task.id })}
                >
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDescription} numberOfLines={2}>
                      {task.description}
                    </Text>
                    <View style={styles.taskFooter}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: task.completed ? '#4CAF50' : '#FF9800' }
                      ]}>
                        <Text style={styles.statusText}>
                          {task.completed ? 'Concluída' : 'Pendente'}
                        </Text>
                      </View>
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(task.priority) }
                      ]}>
                        <Text style={styles.priorityText}>
                          {task.priority === 'high' ? 'Alta' :
                           task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Nenhuma tarefa para este dia
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7F1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F7F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  calendar: {
    marginBottom: 16,
    elevation: 2,
  },
  tasksSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  taskItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CalendarScreen;
