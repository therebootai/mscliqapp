// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'person.fill': 'person',
  'cart.fill': 'shopping-cart',
  'line.3.horizontal': 'menu',
  'magnifyingglass': 'search',
  'xmark': 'close',
  'heart': 'favorite-border',
  'heart.fill': 'favorite',
  'star': 'star-border',
  'star.fill': 'star',
  'list.bullet.rectangle': 'list-alt',
  'xmark.circle.fill': 'cancel',
  'share': 'share',
  'location': 'location-on',
  'headphones': 'headset',
  'shield': 'security',
  'return': 'keyboard-return',
  'award': 'workspace-premium',
  'check-circle': 'check-circle',
  'bag': 'shopping-bag',
  'tag': 'local-offer',
  'square.grid.2x2': 'grid-view',
  'plus': 'add',
  'minus': 'remove',
  'shippingbox.fill': 'local-shipping',
  'arrow.triangle.2.circlepath': 'assignment-return',
  'lock.fill': 'lock',
  'phone.fill': 'phone',
  'envelope.fill': 'email'
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
