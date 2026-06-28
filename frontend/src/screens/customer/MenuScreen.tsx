import React, {useEffect, useState} from 'react';
import {View, SectionList, TouchableOpacity, Text, TextInput, StyleSheet, ActivityIndicator, Alert, Modal, FlatList} from 'react-native';
import {listCategories, listItems} from 'src/api/menu';
import {addCartItem} from 'src/api/cart';
import {useTable} from 'src/context/TableContext';
import {useCart} from 'src/hooks/useCart';

interface Variant {
  id: number;
  name: string;
  price: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  category: number;
  variants: Variant[];
}

interface Category {
  id: number;
  name: string;
}

interface Section {
  title: string;
  data: MenuItem[];
}

export default function MenuScreen({navigation}: any) {
  const {sessionId} = useTable();
  const {cartItems} = useCart();
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const [sections, setSections] = useState<Section[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [variantModal, setVariantModal] = useState<MenuItem | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([listCategories(), listItems()])
      .then(([catRes, itemRes]) => {
        const cats: Category[] = catRes.data;
        const items: MenuItem[] = itemRes.data;
        const grouped = cats
          .map(cat => ({
            title: cat.name.toUpperCase(),
            data: items.filter(i => i.category === cat.id),
          }))
          .filter(s => s.data.length > 0);
        setAllSections(grouped);
        setSections(grouped);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSections(allSections);
      return;
    }
    const q = search.toLowerCase();
    const filtered = allSections
      .map(s => ({
        ...s,
        data: s.data.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)),
      }))
      .filter(s => s.data.length > 0);
    setSections(filtered);
  }, [search, allSections]);

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const handleAdd = async (item: MenuItem, variant?: Variant) => {
    if (!sessionId) {
      Alert.alert('No Table', 'Please join a table first.');
      return;
    }
    try {
      const payload: any = {session: sessionId, menu_item: item.id, quantity: 1};
      if (variant) {
        payload.variant = variant.id;
      }
      await addCartItem(payload);
      const name = variant ? `${item.name} - ${variant.name}` : item.name;
      setVariantModal(null);
      Alert.alert('Added', `${name} added to cart.`, [
        {text: 'OK'},
        {text: 'View Cart', onPress: () => navigation.navigate('Cart')},
      ]);
    } catch {
      Alert.alert('Error', 'Could not add item.');
    }
  };

  const handleItemPress = (item: MenuItem) => {
    if (item.variants && item.variants.length > 0) {
      setVariantModal(item);
    } else {
      navigation.navigate('MenuItemDetail', {itemId: item.id});
    }
  };

  // Build display sections with collapsed support
  const displaySections = sections.map(s => ({
    ...s,
    data: collapsedSections.has(s.title) ? [] : s.data,
  }));

  if (loading) return <ActivityIndicator style={{flex: 1}} color="#8B0000" />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YAMATO</Text>
        <Text style={styles.headerSubtitle}>Menu</Text>
        <TouchableOpacity style={styles.cartIcon} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIconText}>Cart</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search menu..."
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
        placeholderTextColor="#999"
      />

      {/* Menu List */}
      <SectionList
        sections={displaySections}
        keyExtractor={item => String(item.id)}
        renderSectionHeader={({section: {title}}) => {
          const isCollapsed = collapsedSections.has(title);
          return (
            <TouchableOpacity onPress={() => toggleSection(title)} activeOpacity={0.7}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.arrow}>{isCollapsed ? '▸' : '▾'}</Text>
                <View style={styles.sectionLine} />
              </View>
            </TouchableOpacity>
          );
        }}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}>
            <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  {item.variants && item.variants.length > 0 ? `from $${item.price}` : `$${item.price}`}
                </Text>
              </View>
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}
            </View>
            {item.variants && item.variants.length > 0 ? (
              <View style={styles.expandIcon}>
                <Text style={styles.expandIconText}>›</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Variant Modal */}
      <Modal
        visible={!!variantModal}
        transparent
        animationType="slide"
        onRequestClose={() => setVariantModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{variantModal?.name}</Text>
              <TouchableOpacity onPress={() => setVariantModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {variantModal?.description ? (
              <Text style={styles.modalDesc}>{variantModal.description}</Text>
            ) : null}
            <FlatList
              data={variantModal?.variants || []}
              keyExtractor={v => String(v.id)}
              renderItem={({item: variant}) => (
                <View style={styles.variantRow}>
                  <Text style={styles.variantName}>{variant.name}</Text>
                  <Text style={styles.variantPrice}>${variant.price}</Text>
                  <TouchableOpacity
                    style={styles.variantAddBtn}
                    onPress={() => handleAdd(variantModal!, variant)}>
                    <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.variantSeparator} />}
            />
          </View>
        </View>
      </Modal>

      {/* Cart Button */}
      <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
        <Text style={styles.cartBtnText}>View Cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF9F0'},
  header: {alignItems: 'center', paddingTop: 16, paddingBottom: 12, borderBottomWidth: 2, borderColor: '#8B0000', position: 'relative'},
  cartIcon: {position: 'absolute', right: 16, top: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B0000', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16},
  cartIconText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  cartBadge: {backgroundColor: '#fff', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 6},
  cartBadgeText: {color: '#8B0000', fontSize: 12, fontWeight: '800'},
  headerTitle: {fontSize: 28, fontWeight: '800', color: '#8B0000', letterSpacing: 4},
  headerSubtitle: {fontSize: 14, color: '#666', marginTop: 2, letterSpacing: 2},
  searchInput: {margin: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#fff'},
  listContent: {paddingBottom: 20},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: '#FFF9F0'},
  sectionLine: {flex: 1, height: 1, backgroundColor: '#8B0000'},
  sectionTitle: {fontSize: 14, fontWeight: '700', color: '#8B0000', letterSpacing: 3, marginHorizontal: 12},
  arrow: {fontSize: 16, color: '#8B0000', marginRight: 8},
  menuItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e0d8cc'},
  itemContent: {flex: 1},
  itemHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'},
  itemName: {fontSize: 15, fontWeight: '600', color: '#333', flex: 1},
  itemPrice: {fontSize: 15, fontWeight: '700', color: '#8B0000', marginLeft: 8},
  itemDesc: {color: '#888', fontSize: 12, marginTop: 3, lineHeight: 16},
  addBtn: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#8B0000', justifyContent: 'center', alignItems: 'center', marginLeft: 10},
  addBtnText: {color: '#fff', fontSize: 18, fontWeight: 'bold', lineHeight: 20},
  expandIcon: {width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginLeft: 10},
  expandIconText: {fontSize: 24, color: '#8B0000', fontWeight: 'bold'},
  empty: {textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15},
  cartBtn: {backgroundColor: '#8B0000', margin: 16, padding: 14, borderRadius: 8, alignItems: 'center'},
  cartBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1},
  // Modal styles
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalContent: {backgroundColor: '#FFF9F0', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%'},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  modalTitle: {fontSize: 20, fontWeight: '700', color: '#333'},
  modalClose: {fontSize: 22, color: '#999', padding: 4},
  modalDesc: {fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 18},
  variantRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14},
  variantName: {flex: 1, fontSize: 16, color: '#333'},
  variantPrice: {fontSize: 16, fontWeight: '700', color: '#8B0000', marginRight: 12},
  variantAddBtn: {width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B0000', justifyContent: 'center', alignItems: 'center'},
  variantSeparator: {height: StyleSheet.hairlineWidth, backgroundColor: '#e0d8cc'},
});
