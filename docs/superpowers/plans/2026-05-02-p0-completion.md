# P0 Feature Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining P0 frontend features: admin menu item add/edit forms, category CRUD, customer menu search, and profile editing.

**Architecture:** Backend needs two additions: a CategoryDetailView for update/delete, and a search filter on MenuItemListView. Frontend needs four new/updated screens. All follow existing patterns (DRF generics, React Native forms with useState).

**Tech Stack:** Django REST Framework, React Native CLI, TypeScript, React Navigation

---

### Task 1: Backend — Add Category Detail Endpoint (update/delete)

**Files:**
- Modify: `backend/apps/menu/views.py`
- Modify: `backend/apps/menu/urls.py`
- Modify: `backend/apps/menu/tests/test_views.py`

- [ ] **Step 1: Add CategoryDetailView to views.py**

Add after the existing `CategoryListView` class in `backend/apps/menu/views.py`:

```python
class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
```

- [ ] **Step 2: Register the URL**

In `backend/apps/menu/urls.py`, add import and URL pattern:

```python
from .views import CategoryListView, CategoryDetailView, MenuItemListView, MenuItemDetailView, toggle_item_availability
```

Add to urlpatterns:
```python
path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
```

- [ ] **Step 3: Run existing tests to verify no breakage**

Run: `cd backend && python manage.py test apps.menu -v2`
Expected: All 8 existing menu tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/apps/menu/views.py backend/apps/menu/urls.py
git commit -m "feat(menu): add category detail endpoint for update/delete"
```

---

### Task 2: Backend — Add Menu Search Filter

**Files:**
- Modify: `backend/apps/menu/views.py`

- [ ] **Step 1: Add search filter to MenuItemListView**

In `backend/apps/menu/views.py`, modify `get_queryset` in `MenuItemListView` to add search support. Add these lines after the `category_id` filter block:

```python
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
```

- [ ] **Step 2: Test manually or run existing tests**

Run: `cd backend && python manage.py test apps.menu -v2`
Expected: All existing tests still pass.

- [ ] **Step 3: Commit**

```bash
git add backend/apps/menu/views.py
git commit -m "feat(menu): add search filter to menu items endpoint"
```

---

### Task 3: Frontend — Add Menu Item Add/Edit Form Screen (Admin)

**Files:**
- Create: `frontend/src/screens/admin/MenuItemFormScreen.tsx`
- Modify: `frontend/src/navigation/AdminNavigator.tsx`
- Modify: `frontend/src/screens/admin/MenuManagementScreen.tsx`

- [ ] **Step 1: Create MenuItemFormScreen**

Create `frontend/src/screens/admin/MenuItemFormScreen.tsx` — a form screen that handles both creating new items and editing existing ones. When `itemId` is passed via route params, it loads and edits; otherwise it creates.

```tsx
import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView} from 'react-native';
import {listCategories, getItem, createItem, updateItem} from 'src/api/menu';

export default function MenuItemFormScreen({route, navigation}: any) {
  const itemId = route.params?.itemId;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listCategories().then(r => setCategories(r.data));
    if (itemId) {
      getItem(itemId).then(r => {
        const d = r.data;
        setName(d.name);
        setDescription(d.description || '');
        setPrice(String(d.price));
        setImage(d.image || '');
        setCategoryId(d.category);
      });
    }
  }, [itemId]);

  const handleSave = async () => {
    if (!name.trim() || !price.trim() || !categoryId) {
      Alert.alert('Error', 'Name, price, and category are required.');
      return;
    }
    setLoading(true);
    try {
      const data = {name: name.trim(), description: description.trim(), price, image: image.trim(), category: categoryId};
      if (itemId) {
        await updateItem(itemId, data);
      } else {
        await createItem(data);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Item name" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" multiline />

      <Text style={styles.label}>Price</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />

      <Text style={styles.label}>Image URL</Text>
      <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="https://..." />

      <Text style={styles.label}>Category</Text>
      <View style={styles.catRow}>
        {categories.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catBtn, categoryId === c.id && styles.catBtnActive]}
            onPress={() => setCategoryId(c.id)}>
            <Text style={[styles.catText, categoryId === c.id && styles.catTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Saving...' : itemId ? 'Update Item' : 'Add Item'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 16},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 4},
  input: {borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15},
  catRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4},
  catBtn: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee'},
  catBtnActive: {backgroundColor: '#E84545'},
  catText: {color: '#333', fontSize: 13},
  catTextActive: {color: '#fff', fontWeight: 'bold'},
  saveBtn: {backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40},
  saveBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
```

- [ ] **Step 2: Add route to AdminNavigator**

In `frontend/src/navigation/AdminNavigator.tsx`, add the import and screen:

```tsx
import MenuItemFormScreen from 'src/screens/admin/MenuItemFormScreen';
```

Add inside `<Stack.Navigator>` after MenuManagement:
```tsx
<Stack.Screen name="MenuItemForm" component={MenuItemFormScreen} options={{title: 'Menu Item'}} />
```

- [ ] **Step 3: Update MenuManagementScreen with Add and Edit buttons**

In `frontend/src/screens/admin/MenuManagementScreen.tsx`:

1. Add an "Edit" button in each row (next to Delete)
2. Add an "Add Item" button alongside the "Manage Categories" button
3. Use `useFocusEffect` to reload data when returning from the form

Replace the entire file content:

```tsx
import React, {useState, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Switch} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {listItems, deleteItem, toggleItem} from 'src/api/menu';

export default function MenuManagementScreen({navigation}: any) {
  const [items, setItems] = useState<any[]>([]);

  const load = () => listItems().then(res => setItems(res.data));
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete', `Delete "${name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => { await deleteItem(id); load(); }},
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        onRefresh={load}
        refreshing={false}
        renderItem={({item}) => (
          <View style={styles.row}>
            <TouchableOpacity style={styles.info} onPress={() => navigation.navigate('MenuItemForm', {itemId: item.id})}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price}</Text>
            </TouchableOpacity>
            <Switch value={item.is_available} onValueChange={async () => { await toggleItem(item.id); load(); }} />
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.del}>
              <Text style={styles.delText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('MenuItemForm')}>
          <Text style={styles.btnText}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('CategoryManagement')}>
          <Text style={styles.btnText}>Categories</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  row: {flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#eee'},
  info: {flex: 1},
  name: {fontSize: 15, fontWeight: '500'},
  price: {color: '#888', fontSize: 13},
  del: {marginLeft: 12},
  delText: {color: '#E84545'},
  btnRow: {flexDirection: 'row', margin: 16, gap: 12},
  primaryBtn: {flex: 1, backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center'},
  secondaryBtn: {flex: 1, backgroundColor: '#4A90E2', padding: 14, borderRadius: 8, alignItems: 'center'},
  btnText: {color: '#fff', fontWeight: 'bold'},
});
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/screens/admin/MenuItemFormScreen.tsx frontend/src/screens/admin/MenuManagementScreen.tsx frontend/src/navigation/AdminNavigator.tsx
git commit -m "feat(admin): add menu item create/edit form screen"
```

---

### Task 4: Frontend — Add Category CRUD to CategoryManagementScreen (Admin)

**Files:**
- Modify: `frontend/src/screens/admin/CategoryManagementScreen.tsx`
- Modify: `frontend/src/api/menu.ts`

- [ ] **Step 1: Add category API functions**

In `frontend/src/api/menu.ts`, add these exports:

```ts
export const createCategory = (data: {name: string; sort_order?: number}) =>
  client.post('/menu/categories/', data);
export const updateCategory = (id: number, data: {name?: string; sort_order?: number}) =>
  client.patch(`/menu/categories/${id}/`, data);
export const deleteCategory = (id: number) => client.delete(`/menu/categories/${id}/`);
```

- [ ] **Step 2: Rewrite CategoryManagementScreen with full CRUD**

Replace the entire content of `frontend/src/screens/admin/CategoryManagementScreen.tsx`:

```tsx
import React, {useState, useCallback} from 'react';
import {FlatList, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {listCategories, createCategory, updateCategory, deleteCategory} from 'src/api/menu';

export default function CategoryManagementScreen() {
  const [cats, setCats] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = () => listCategories().then(r => setCats(r.data));
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required.'); return; }
    try {
      if (editingId) {
        await updateCategory(editingId, {name: name.trim(), sort_order: Number(sortOrder)});
      } else {
        await createCategory({name: name.trim(), sort_order: Number(sortOrder)});
      }
      setName('');
      setSortOrder('0');
      setEditingId(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save.');
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSortOrder(String(cat.sort_order));
  };

  const handleDelete = (id: number, catName: string) => {
    Alert.alert('Delete', `Delete "${catName}"? Items in this category will also be deleted.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => { await deleteCategory(id); load(); }},
    ]);
  };

  const cancelEdit = () => { setEditingId(null); setName(''); setSortOrder('0'); };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Category name" />
        <TextInput style={styles.sortInput} value={sortOrder} onChangeText={setSortOrder} placeholder="Sort" keyboardType="number-pad" />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Add'}</Text>
        </TouchableOpacity>
        {editingId && (
          <TouchableOpacity onPress={cancelEdit}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={cats}
        keyExtractor={c => String(c.id)}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.catName}>{item.name}</Text>
              <Text style={styles.order}>Sort: {item.sort_order}</Text>
            </View>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.delBtn}>
              <Text style={styles.delText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  form: {flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee', gap: 8},
  input: {flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15},
  sortInput: {width: 60, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, textAlign: 'center'},
  saveBtn: {backgroundColor: '#E84545', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8},
  saveBtnText: {color: '#fff', fontWeight: 'bold'},
  cancelText: {color: '#888', fontSize: 13},
  row: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee'},
  info: {flex: 1},
  catName: {fontSize: 16, fontWeight: '500'},
  order: {color: '#888', fontSize: 13},
  editBtn: {marginRight: 12},
  editText: {color: '#4A90E2', fontWeight: '500'},
  delBtn: {},
  delText: {color: '#E84545', fontWeight: '500'},
});
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/menu.ts frontend/src/screens/admin/CategoryManagementScreen.tsx
git commit -m "feat(admin): add full category CRUD to CategoryManagementScreen"
```

---

### Task 5: Frontend — Add Menu Search (Customer)

**Files:**
- Modify: `frontend/src/screens/customer/MenuScreen.tsx`
- Modify: `frontend/src/api/menu.ts`

- [ ] **Step 1: Add search param to listItems API**

In `frontend/src/api/menu.ts`, update the `listItems` function signature:

```ts
export const listItems = (params?: {category?: number; search?: string}) =>
  client.get('/menu/items/', {params});
```

- [ ] **Step 2: Add search bar to MenuScreen**

Replace `frontend/src/screens/customer/MenuScreen.tsx` with:

```tsx
import React, {useEffect, useState} from 'react';
import {View, FlatList, TouchableOpacity, Text, TextInput, StyleSheet, ActivityIndicator} from 'react-native';
import {listCategories, listItems} from 'src/api/menu';
import MenuItemCard from 'src/components/MenuItemCard';

export default function MenuScreen({navigation}: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories().then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: {category?: number; search?: string} = {};
    if (selectedCat) params.category = selectedCat;
    if (search.trim()) params.search = search.trim();
    listItems(Object.keys(params).length ? params : undefined)
      .then(res => setItems(res.data))
      .finally(() => setLoading(false));
  }, [selectedCat, search]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search menu..."
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />
      <FlatList
        horizontal
        data={[{id: null, name: 'All'}, ...categories]}
        keyExtractor={c => String(c.id)}
        renderItem={({item: cat}) => (
          <TouchableOpacity
            style={[styles.catBtn, selectedCat === cat.id && styles.catBtnActive]}
            onPress={() => setSelectedCat(cat.id)}>
            <Text style={[styles.catText, selectedCat === cat.id && styles.catTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        )}
        style={styles.catList}
        showsHorizontalScrollIndicator={false}
      />
      {loading ? (
        <ActivityIndicator style={{flex: 1}} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          renderItem={({item}) => (
            <MenuItemCard item={item} onPress={() => navigation.navigate('MenuItemDetail', {itemId: item.id})} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
        />
      )}
      <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
        <Text style={styles.cartBtnText}>View Cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  searchInput: {margin: 12, marginBottom: 0, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#f9f9f9'},
  catList: {maxHeight: 52, paddingHorizontal: 12, paddingVertical: 8},
  catBtn: {paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#eee', marginRight: 8},
  catBtnActive: {backgroundColor: '#E84545'},
  catText: {color: '#333'},
  catTextActive: {color: '#fff', fontWeight: 'bold'},
  empty: {textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15},
  cartBtn: {backgroundColor: '#E84545', margin: 16, padding: 14, borderRadius: 8, alignItems: 'center'},
  cartBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/menu.ts frontend/src/screens/customer/MenuScreen.tsx
git commit -m "feat(customer): add menu search functionality"
```

---

### Task 6: Frontend — Add Profile Edit UI (Customer)

**Files:**
- Modify: `frontend/src/screens/customer/ProfileScreen.tsx`

- [ ] **Step 1: Rewrite ProfileScreen with edit functionality**

The backend already supports `PATCH /api/auth/profile/` for name and phone. Replace `frontend/src/screens/customer/ProfileScreen.tsx`:

```tsx
import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useAuth} from 'src/context/AuthContext';
import {updateProfile} from 'src/api/auth';

export default function ProfileScreen() {
  const {user, logout, refreshUser} = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({name: name.trim(), phone: phone.trim()});
      await refreshUser();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEditing(false);
  };

  return (
    <View style={styles.container}>
      {editing ? (
        <>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <View style={styles.editBtnRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.phone}>{user?.phone || 'No phone number'}</Text>
          <Text style={styles.role}>{user?.role}</Text>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24, backgroundColor: '#fff'},
  name: {fontSize: 24, fontWeight: 'bold', marginBottom: 8},
  email: {color: '#666', marginBottom: 4},
  phone: {color: '#666', marginBottom: 4},
  role: {color: '#888', marginBottom: 24, textTransform: 'capitalize'},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 4},
  input: {borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15},
  editBtnRow: {flexDirection: 'row', gap: 12, marginTop: 20},
  saveBtn: {flex: 1, backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center'},
  saveBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  cancelBtn: {flex: 1, backgroundColor: '#eee', padding: 14, borderRadius: 8, alignItems: 'center'},
  cancelBtnText: {color: '#333', fontWeight: 'bold', fontSize: 16},
  editProfileBtn: {backgroundColor: '#4A90E2', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12},
  editProfileBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  logoutBtn: {backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 'auto'},
  logoutText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
```

- [ ] **Step 2: Add refreshUser to AuthContext**

The ProfileScreen needs a `refreshUser` function to re-fetch user data after editing. In `frontend/src/context/AuthContext.tsx`, add a `refreshUser` function that calls `getProfile()` and updates the user state. Add it to the context value alongside login, register, logout.

```tsx
// Add to the context interface:
refreshUser: () => Promise<void>;

// Add the function inside the provider:
const refreshUser = async () => {
  const res = await getProfile();
  setUser(res.data);
};

// Add to the value prop:
value={{user, loading, login, register, logout, refreshUser}}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/screens/customer/ProfileScreen.tsx frontend/src/context/AuthContext.tsx
git commit -m "feat(customer): add profile edit functionality"
```
