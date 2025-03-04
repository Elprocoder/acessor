import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const UpcomingTasksScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = async () => {
    try {
      const tasksRef = collection(db, 'tasks');
      const today = new Date();
      const upcomingDate = new Date();
      upcomingDate.setDate(today.getDate() + 7);

      const q = query(
        tasksRef,
        where('userId', '==', auth.currentUser.uid),
        where('completed', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          const dueDate = data.dueDate.toDate();
          return {
            id: doc.id,
            ...data,
            daysUntilDue: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
          };
        })
        .filter(task => task.dueDate.toDate() <= upcomingDate)
        .sort((a, b) => a.dueDate.toDate() - b.dueDate.toDate());
      
      setTasks(tasksData);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
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

  const getDueDateStatus = (daysUntilDue) => {
    if (daysUntilDue < 0) {
      return {
        text: 'Atrasada',
        color: '#EE316B',
        icon: 'alert-circle'
      };
    } else if (daysUntilDue === 0) {
      return {
        text: 'Vence hoje',
        color: '#FF9800',
        icon: 'time'
      };
    } else if (daysUntilDue === 1) {
      return {
        text: 'Vence amanhã',
        color: '#FF9800',
        icon: 'time'
      };
    } else {
      return {
        text: `Vence em ${daysUntilDue} dias`,
        color: '#4CAF50',
        icon: 'calendar'
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
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
        <Text style={styles.headerTitle}>Prazos Próximos</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const status = getDueDateStatus(task.daysUntilDue);
            return (
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
                    <View style={styles.taskInfo}>
                      <View style={styles.statusContainer}>
                        <Ionicons name={status.icon} size={16} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>
                          {status.text}
                        </Text>
                      </View>
                      <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.taskDate}>
                          {task.dueDate.toDate().toLocaleDateString('pt-BR')}
                        </Text>
                        <Ionicons name="time-outline" size={16} color="#666" style={styles.timeIcon} />
                        <Text style={styles.taskTime}>
                          {(task.dueTime?.toDate() || task.dueDate.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                      <Text style={styles.priorityText}>{getPriorityLabel(task.priority)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>
              Nenhuma tarefa com prazo próximo
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
    alignItems: 'flex-end',
  },
  taskInfo: {
    flex: 1,
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateContainer: {
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
    padding: 24,
    marginTop: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default UpcomingTasksScreen;
