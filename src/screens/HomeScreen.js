import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  RefreshControl,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { playSound } from '../utils/sound';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({
    pendingTasks: 0,
    completedTasks: 0,
    upcomingDeadlines: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const tasksRef = collection(db, 'tasks');

      const today = new Date();
      const upcomingDate = new Date();
      upcomingDate.setDate(today.getDate() + 7);

      // Consulta para tarefas pendentes
      const pendingQuery = query(
        tasksRef,
        where('userId', '==', user.uid),
        where('completed', '==', false)
      );
      const pendingSnapshot = await getDocs(pendingQuery);

      // Consulta para tarefas concluídas
      const completedQuery = query(
        tasksRef,
        where('userId', '==', user.uid),
        where('completed', '==', true)
      );
      const completedSnapshot = await getDocs(completedQuery);

      // Consulta para prazos próximos
      const upcomingQuery = query(
        tasksRef,
        where('userId', '==', user.uid),
        where('completed', '==', false)
      );
      const upcomingSnapshot = await getDocs(upcomingQuery);
      const upcomingTasks = upcomingSnapshot.docs
        .map(doc => ({ ...doc.data() }))
        .filter(task => task.dueDate.toDate() <= upcomingDate);

      // Consulta para tarefas recentes
      const recentQuery = query(
        tasksRef,
        where('userId', '==', user.uid)
      );
      const recentSnapshot = await getDocs(recentQuery);
      const recentTasksData = recentSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
        .slice(0, 5);

      setUserStats({
        pendingTasks: pendingSnapshot.size,
        completedTasks: completedSnapshot.size,
        upcomingDeadlines: upcomingTasks.length,
      });
      setRecentTasks(recentTasksData);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fazer logout');
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, []);

  const StatCard = ({ title, value, icon, color }) => {
    const { theme } = useTheme();
    return (
      <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
        </View>
      </View>
    );
  };

  const QuickActionButton = ({ icon, title, subtitle, onPress, color }) => {
    const { theme, isDarkMode } = useTheme();
    return (
      <TouchableOpacity
        style={[
          styles.quickActionCard,
          {
            backgroundColor: isDarkMode ? theme.card : color,
            borderWidth: isDarkMode ? 1 : 0,
            borderColor: color,
          }
        ]}
        onPress={onPress}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons 
            name={icon} 
            size={28} 
            color={isDarkMode ? color : '#FFF'} 
          />
        </View>
        <Text style={[
          styles.quickActionTitle,
          { color: isDarkMode ? color : '#FFF' }
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.quickActionSubtitle,
          { color: isDarkMode ? theme.textSecondary : 'rgba(255, 255, 255, 0.9)' }
        ]}>
          {subtitle}
        </Text>
      </TouchableOpacity>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'alta':
      case 'high':
        return '#FF4444';
      case 'média':
      case 'medium':
        return '#FF9800';
      case 'baixa':
      case 'low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const TaskItem = ({ task }) => {
    const { theme, isDarkMode } = useTheme();
    const dueDate = task.dueDate.toDate();
    const formattedDate = dueDate.toLocaleDateString('pt-BR');
    const formattedTime = dueDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const priorityColor = getPriorityColor(task.priority);
    const priorityText = getPriorityText(task.priority);

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          { 
            backgroundColor: isDarkMode ? theme.card : theme.surface,
            borderLeftColor: priorityColor,
            borderLeftWidth: 4,
          }
        ]}
        onPress={() => navigation.navigate('EditTask', { taskId: task.id })}
      >
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
          <Text style={[styles.taskDescription, { color: theme.textSecondary }]}>
            {task.description}
          </Text>
          <View style={styles.taskFooter}>
            <View style={styles.taskMetadata}>
              <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.taskDate, { color: theme.textSecondary }]}>
                {formattedDate}
              </Text>
              <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.taskTime, { color: theme.textSecondary }]}>
                {formattedTime}
              </Text>
            </View>
            <View style={[
              styles.priorityBadge, 
              { 
                backgroundColor: isDarkMode ? 'transparent' : priorityColor,
                borderWidth: isDarkMode ? 1 : 0,
                borderColor: priorityColor,
              }
            ]}>
              <Text style={[
                styles.priorityText,
                { color: isDarkMode ? priorityColor : '#FFFFFF' }
              ]}>
                {priorityText}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.welcomeText, { color: theme.text }]}>{`Olá, ${user?.displayName || 'Usuário'}`}</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        data={[{ key: 'stats' }, { key: 'quickActions' }, { key: 'tasks' }]}
        keyExtractor={item => item.key}
        renderItem={({ item }) => {
          switch (item.key) {
            case 'stats':
              return (
                <View style={styles.statsContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PendingTasks')}
                    activeOpacity={0.7}
                  >
                    <StatCard
                      title="Tarefas Pendentes"
                      value={userStats.pendingTasks}
                      icon="hourglass-outline"
                      color="#38D7E7"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('CompletedTasks')}
                    activeOpacity={0.7}
                  >
                    <StatCard
                      title="Tarefas Concluídas"
                      value={userStats.completedTasks}
                      icon="checkmark-circle-outline"
                      color="#4CAF50"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('UpcomingTasks')}
                    activeOpacity={0.7}
                  >
                    <StatCard
                      title="Prazos Próximos"
                      value={userStats.upcomingDeadlines}
                      icon="alert-circle-outline"
                      color="#FF9800"
                    />
                  </TouchableOpacity>
                </View>
              );
            case 'quickActions':
              return (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Ações Rápidas</Text>
                  <View style={styles.quickActionsGrid}>
                    <View style={styles.quickActionsRow}>
                      <QuickActionButton
                        icon="add-circle"
                        title="Nova Tarefa"
                        subtitle="Adicione uma tarefa"
                        onPress={() => navigation.navigate('NewTask')}
                        color="#38D7E7"
                      />
                      <QuickActionButton
                        icon="calendar"
                        title="Calendário"
                        subtitle="Visualize suas tarefas"
                        onPress={() => navigation.navigate('Calendar')}
                        color="#FF9800"
                      />
                    </View>
                    <View style={styles.quickActionsRow}>
                      <QuickActionButton
                        icon="bar-chart"
                        title="Relatórios"
                        subtitle="Análise de desempenho"
                        onPress={() => navigation.navigate('Reports')}
                        color="#4CAF50"
                      />
                      <QuickActionButton
                        icon="settings"
                        title="Configurações"
                        subtitle="Personalize o app"
                        onPress={() => navigation.navigate('Settings')}
                        color="#9C27B0"
                      />
                    </View>
                  </View>
                </View>
              );
            case 'tasks':
              return (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Tarefas Recentes</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('NewTask')}
                      style={[styles.addButton, { backgroundColor: '#4CAF50' }]}
                    >
                      <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                  {recentTasks.length > 0 ? (
                    <View>
                      {recentTasks.map((task) => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={[styles.emptyStateText, { color: theme.text }]}>
                        Nenhuma tarefa encontrada
                      </Text>
                    </View>
                  )}
                </View>
              );
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16, // Margem lateral em toda a tela
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
    paddingTop: 48,
    paddingBottom: 16,
    marginHorizontal: -16, // Compensar o padding do container
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginTop: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8, // Espaçamento entre os cards
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'column',
    marginHorizontal: -8, // Aumentar margem negativa para compensar padding maior
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8, // Adicionar padding horizontal para espaçamento
  },
  quickActionCard: {
    width: '48%', // Definir largura fixa para evitar corte
    margin: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
  taskItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 12,
    marginLeft: 4,
    marginRight: 12,
  },
  taskTime: {
    fontSize: 12,
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default HomeScreen;
