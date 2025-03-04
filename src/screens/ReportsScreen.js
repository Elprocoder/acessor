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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const ReportsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    completionRate: 0,
    averageCompletionTime: 0,
  });

  const loadReportData = async () => {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      let totalTasks = 0;
      let completedTasks = 0;
      let pendingTasks = 0;
      let overdueTasks = 0;
      let highPriority = 0;
      let mediumPriority = 0;
      let lowPriority = 0;
      let totalCompletionTime = 0;
      const now = new Date();

      querySnapshot.forEach((doc) => {
        const task = doc.data();
        totalTasks++;

        // Contagem por prioridade
        if (task.priority === 'high') highPriority++;
        else if (task.priority === 'medium') mediumPriority++;
        else lowPriority++;

        if (task.completed) {
          completedTasks++;
          // Calcula tempo de conclusão em dias
          const completionTime = task.completedAt.toDate() - task.createdAt.toDate();
          totalCompletionTime += completionTime / (1000 * 60 * 60 * 24); // Converte para dias
        } else {
          pendingTasks++;
          // Verifica se está atrasada
          if (task.dueDate.toDate() < now) {
            overdueTasks++;
          }
        }
      });

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const averageCompletionTime = completedTasks > 0 ? totalCompletionTime / completedTasks : 0;

      setReportData({
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        highPriority,
        mediumPriority,
        lowPriority,
        completionRate: Math.round(completionRate),
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const ReportCard = ({ title, value, icon, color, subtitle }) => (
    <View style={[styles.reportCard, { borderLeftColor: color }]}>
      <View style={styles.reportHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.reportTitle}>{title}</Text>
      </View>
      <Text style={[styles.reportValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.reportSubtitle}>{subtitle}</Text>}
    </View>
  );

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
        <Text style={styles.headerTitle}>Relatórios</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral</Text>
          <ReportCard
            title="Total de Tarefas"
            value={reportData.totalTasks}
            icon="documents-outline"
            color="#38D7E7"
          />
          <ReportCard
            title="Taxa de Conclusão"
            value={`${reportData.completionRate}%`}
            icon="pie-chart-outline"
            color="#4CAF50"
          />
          <ReportCard
            title="Tempo Médio de Conclusão"
            value={reportData.averageCompletionTime}
            icon="time-outline"
            color="#FF9800"
            subtitle="dias"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <ReportCard
            title="Tarefas Concluídas"
            value={reportData.completedTasks}
            icon="checkmark-circle-outline"
            color="#4CAF50"
          />
          <ReportCard
            title="Tarefas Pendentes"
            value={reportData.pendingTasks}
            icon="hourglass-outline"
            color="#38D7E7"
          />
          <ReportCard
            title="Tarefas Atrasadas"
            value={reportData.overdueTasks}
            icon="alert-circle-outline"
            color="#EE316B"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prioridades</Text>
          <ReportCard
            title="Alta Prioridade"
            value={reportData.highPriority}
            icon="flag"
            color="#EE316B"
          />
          <ReportCard
            title="Média Prioridade"
            value={reportData.mediumPriority}
            icon="flag"
            color="#FF9800"
          />
          <ReportCard
            title="Baixa Prioridade"
            value={reportData.lowPriority}
            icon="flag"
            color="#4CAF50"
          />
        </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  reportValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  reportSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default ReportsScreen;
