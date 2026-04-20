// Match Layout — Top swipeable tabs (Live, Scorecard, Info)
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';

export default function MatchLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadMatch, teamAName, teamBName } = useMatchStore();

  useEffect(() => {
    if (id) loadMatch(id);
  }, [id]);

  return (
    <Tabs
      screenOptions={{
        tabBarPosition: 'top',
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        headerStyle: {
          backgroundColor: Colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
      }}
    >
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          headerTitle: `${teamAName || 'Team A'} vs ${teamBName || 'Team B'}`,
          tabBarIcon: ({ color }) => <Ionicons name="flash" size={16} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scorecard"
        options={{
          title: 'Scorecard',
          headerTitle: 'Scorecard',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={16} color={color} />,
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: 'Info',
          headerTitle: 'Match Info',
          tabBarIcon: ({ color }) => <Ionicons name="information-circle" size={16} color={color} />,
        }}
      />
    </Tabs>
  );
}
