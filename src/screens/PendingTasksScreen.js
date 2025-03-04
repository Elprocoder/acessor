import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const PendingTasksScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tasksRef = collection(db, 'tasks');
      console.log('User ID:', auth.currentUser.uid);
      
      const q = query(
        tasksRef,
        where('userId', '==', auth.currentUser.uid),
        where('completed', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Número de tarefas encontradas:', querySnapshot.size);
      
      const tasksData = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('Task data:', data);
          return {
            id: doc.id,
            ...data
          };
        })
        .sort((a, b) => a.dueDate.toDate() - b.dueDate.toDate());
      
      console.log('Tasks processadas:', tasksData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Erro detalhado ao carregar tarefas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as tarefas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, []);

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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      default:
        return 'Baixa';
    }
  };

  const renderItem = ({ item }) => {
    const isOverdue = item.dueDate.toDate() < new Date();
    return (
      <TouchableOpacity
        style={[styles.taskItem, { borderLeftColor: getPriorityColor(item.priority) }]}
        onPress={() => navigation.navigate('EditTask', { taskId: item.id })}
      >
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.taskFooter}>
            <View style={styles.taskInfo}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={[styles.taskDate, isOverdue && styles.overdueText]}>
                {item.dueDate.toDate().toLocaleDateString('pt-BR')}
              </Text>
              <Ionicons name="time-outline" size={16} color="#666" style={styles.timeIcon} />
              <Text style={[styles.taskTime, isOverdue && styles.overdueText]}>
                {(item.dueTime?.toDate() || item.dueDate.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{getPriorityLabel(item.priority)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tarefas Pendentes</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            renderItem({ item: task })
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#B0B0B0" />
            <Text style={styles.emptyStateText}>
              Nenhuma tarefa pendente
            </Text>
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
    padding: 16,
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 12,
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
    fontWeight: 'bold',
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
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  timeIcon: {
    marginLeft: 8,
  },
  taskTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  overdueText: {
    color: '#EE316B',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyStateText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
});

export default PendingTasksScreen;
