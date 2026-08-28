<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Memory {
  id: number
  fact: string
  category: string
  workspace_path: string
  source: string
  created_at: string
}

const memories = ref<Memory[]>([])
const searchQuery = ref('')
const workspace = ref('')
const loading = ref(true)
let searchTimer: ReturnType<typeof setTimeout>

const filteredMemories = computed(() => memories.value)

async function load(query = '') {
  loading.value = true
  const url = query ? `/api/search?q=${encodeURIComponent(query)}` : '/api/memories'
  const res = await fetch(url)
  const data = await res.json()
  memories.value = data.memories || []
  workspace.value = data.workspace || ''
  loading.value = false
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(searchQuery.value), 300)
}

async function deleteMemory(id: number) {
  await fetch(`/api/memories/${id}`, { method: 'DELETE' })
  load(searchQuery.value)
}

function formatDate(dt: string) {
  const d = new Date(dt)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    pattern: '#4caf50',
    decision: '#5c9eff',
    preference: '#c084fc',
    'file-ref': '#f59e0b',
    general: '#888'
  }
  return map[cat] || '#888'
}

onMounted(() => load())
</script>

<template>
  <div class="layout">
    <header>
      <div class="header-left">
        <h1>usememoire <span>/ dashboard</span></h1>
        <div class="workspace">{{ workspace || 'detecting workspace...' }}</div>
      </div>
      <div class="stats">
        <div class="stat">
          <span class="stat-value">{{ memories.length }}</span>
          <span class="stat-label">memories</span>
        </div>
      </div>
    </header>

    <main>
      <div class="search-bar">
        <input
          v-model="searchQuery"
          @input="onSearch"
          type="text"
          placeholder="Search memories..."
          autocomplete="off"
        />
      </div>

      <div v-if="loading" class="empty">Loading...</div>

      <div v-else-if="!memories.length" class="empty">
        <div class="empty-title">No memories yet</div>
        <div class="empty-sub">Use <code>[SAVE_MEMORY]</code> in your chat or ask Claude to use the save_memory tool</div>
      </div>

      <div v-else class="memory-list">
        <div
          v-for="m in filteredMemories"
          :key="m.id"
          class="memory-card"
        >
          <div class="memory-body">
            <div class="memory-fact">{{ m.fact }}</div>
            <div class="memory-meta">
              <span class="badge" :style="{ color: categoryColor(m.category), borderColor: categoryColor(m.category) + '44', background: categoryColor(m.category) + '11' }">
                {{ m.category }}
              </span>
              <span class="badge badge-source">{{ m.source }}</span>
              <span class="date">{{ formatDate(m.created_at) }}</span>
            </div>
          </div>
          <button class="delete-btn" @click="deleteMemory(m.id)" title="Delete">✕</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  padding: 20px 32px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  background: var(--bg);
  z-index: 10;
}

h1 {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

h1 span {
  color: var(--text-muted);
  font-weight: 400;
}

.workspace {
  font-size: 11px;
  color: var(--text-dim);
  font-family: monospace;
  margin-top: 4px;
}

.stats {
  display: flex;
  gap: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

main {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;
  flex: 1;
}

.search-bar input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 16px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  margin-bottom: 24px;
}

.search-bar input:focus {
  border-color: #444;
}

.search-bar input::placeholder {
  color: var(--text-dim);
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  transition: border-color 0.15s;
}

.memory-card:hover {
  border-color: var(--border-hover);
}

.memory-body {
  flex: 1;
  min-width: 0;
}

.memory-fact {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  word-break: break-word;
}

.memory-meta {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  border: 1px solid transparent;
}

.badge-source {
  background: #1e1e1e;
  color: var(--text-dim);
  border-color: var(--border);
}

.date {
  font-size: 11px;
  color: var(--text-dim);
}

.delete-btn {
  background: none;
  border: none;
  color: #444;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: color 0.15s;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

.delete-btn:hover {
  color: var(--danger);
}

.empty {
  text-align: center;
  padding: 80px 24px;
  color: var(--text-muted);
}

.empty-title {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-sub {
  font-size: 13px;
  color: var(--text-dim);
}

.empty-sub code {
  background: #1a1a1a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #5c9eff;
}
</style>
