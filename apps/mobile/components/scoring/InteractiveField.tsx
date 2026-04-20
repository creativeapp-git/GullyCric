import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, Text, TouchableOpacity } from 'react-native';
import Svg, { Ellipse, Rect, Path, Line, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';
import { Ball } from '@/db/schema';

const FIELD_WIDTH = Dimensions.get('window').width - 60; 
const FIELD_HEIGHT = 280;

// Pitch coordinates (center of the field)
const PITCH_WIDTH = 30;
const PITCH_HEIGHT = 100;
const PITCH_X = FIELD_WIDTH / 2 - PITCH_WIDTH / 2;
const PITCH_Y = FIELD_HEIGHT / 2 - PITCH_HEIGHT / 2;

// Batting crease (bottom of pitch)
const BATTING_CREASE_X = FIELD_WIDTH / 2;
const BATTING_CREASE_Y = PITCH_Y + PITCH_HEIGHT - 10;

interface InteractiveFieldProps {
  balls?: Ball[];
  readOnly?: boolean;
}

export function InteractiveField({ balls, readOnly }: InteractiveFieldProps) {
  const store = useMatchStore();
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  // Capture gesture - only if not readOnly
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !readOnly,
      onMoveShouldSetPanResponder: () => !readOnly,
      onPanResponderGrant: (e) => {
        if (readOnly) return;
        const { locationX, locationY } = e.nativeEvent;
        setCurrentPath([
          { x: BATTING_CREASE_X, y: BATTING_CREASE_Y },
          { x: locationX, y: locationY }
        ]);
      },
      onPanResponderMove: (e) => {
        if (readOnly) return;
        const { locationX, locationY } = e.nativeEvent;
        setCurrentPath((prev) => [
          ...prev,
          { x: locationX, y: locationY }
        ]);
      },
      onPanResponderRelease: () => {
        if (readOnly) return;
        if (currentPath.length > 2) {
          store.setTrajectory(currentPath);
        } else {
          store.setTrajectory(null);
          setCurrentPath([]);
        }
      },
    })
  ).current;

  const clearPath = () => {
    setCurrentPath([]);
    store.setTrajectory(null);
  };

  // Convert trajectory array to SVG Path string
  const getPathData = (traj: any[]) => {
    if (!traj || traj.length === 0) return '';
    return `M ${traj[0].x} ${traj[0].y} ` +
      traj.slice(1).map((p: any) => `L ${p.x} ${p.y}`).join(' ');
  };

  const pathData = getPathData(currentPath);
  const storePathData = getPathData(store.currentTrajectory || []);
  const displayPath = storePathData || pathData;
  const hasPath = displayPath.length > 0;

  // Render historical balls if provided
  const historicalPaths = balls
    ?.filter(b => b.shot_trajectory_json)
    .map((b, i) => {
      try {
        const traj = JSON.parse(b.shot_trajectory_json!);
        return {
          path: getPathData(traj),
          isWicket: b.is_wicket === 1,
          lastPoint: traj[traj.length - 1]
        };
      } catch (e) { return null; }
    })
    .filter(p => p !== null) || [];

  return (
    <View style={[styles.container, readOnly && styles.readOnlyContainer]}>
      {!readOnly && (
        <View style={styles.header}>
          <Text style={styles.title}>Shot Trajectory</Text>
          {hasPath && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearPath}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.fieldWrapper} {...panResponder.panHandlers}>
        <Svg width={FIELD_WIDTH} height={FIELD_HEIGHT}>
          {/* Main Field (Oval) */}
          <Ellipse
            cx={FIELD_WIDTH / 2}
            cy={FIELD_HEIGHT / 2}
            rx={FIELD_WIDTH / 2}
            ry={FIELD_HEIGHT / 2}
            fill="#27AE60" 
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth={3}
          />

          {/* 30 Yard Circle */}
          <Ellipse
            cx={FIELD_WIDTH / 2}
            cy={FIELD_HEIGHT / 2}
            rx={FIELD_WIDTH / 3.5}
            ry={FIELD_HEIGHT / 3.5}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* The Pitch */}
          <Rect
            x={PITCH_X}
            y={PITCH_Y}
            width={PITCH_WIDTH}
            height={PITCH_HEIGHT}
            fill="#D7CCC8"
            rx={2}
          />

          {/* Wickets */}
          <Rect x={FIELD_WIDTH / 2 - 4} y={PITCH_Y + 2} width={8} height={4} fill="#FFB300" />
          <Rect x={FIELD_WIDTH / 2 - 4} y={PITCH_Y + PITCH_HEIGHT - 6} width={8} height={4} fill="#FFB300" />

          {/* Batter Indicator */}
          <Circle cx={BATTING_CREASE_X} cy={BATTING_CREASE_Y} r={4} fill={Colors.primary} />

          {/* Historical Paths (Faded) */}
          {historicalPaths.map((hp, i) => (
            <React.Fragment key={i}>
              <Path
                d={hp!.path}
                fill="none"
                stroke={hp!.isWicket ? Colors.danger : "rgba(255,255,255,0.4)"}
                strokeWidth={2}
                strokeDasharray={hp!.isWicket ? "0" : "5 5"}
              />
              <Circle cx={hp!.lastPoint.x} cy={hp!.lastPoint.y} r={3} fill={hp!.isWicket ? Colors.danger : "#FFF"} />
            </React.Fragment>
          ))}

          {/* Current Drawn Path */}
          {hasPath && (
            <>
              <Path
                d={displayPath}
                fill="none"
                stroke={Colors.primary}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx={store.currentTrajectory ? store.currentTrajectory[store.currentTrajectory.length - 1].x : currentPath[currentPath.length - 1]?.x}
                cy={store.currentTrajectory ? store.currentTrajectory[store.currentTrajectory.length - 1].y : currentPath[currentPath.length - 1]?.y}
                r={6}
                fill="#FFF"
                stroke={Colors.primary}
                strokeWidth={2}
              />
            </>
          )}
        </Svg>
        
        {!hasPath && !readOnly && (
          <View style={styles.hintOverlay} pointerEvents="none">
            <Ionicons name="hand-right-outline" size={24} color="rgba(255,255,255,0.6)" style={styles.swipeIcon} />
            <Text style={styles.hintText}>Swipe to track shot</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readOnlyContainer: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fontBold,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dangerGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  clearText: {
    color: Colors.danger,
    fontSize: 12,
    fontFamily: Typography.fontBold,
  },
  fieldWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  hintOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  swipeIcon: { marginBottom: 4 },
  hintText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: Typography.fontBold,
  },
});
