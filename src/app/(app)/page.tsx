'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Calendar, AlertCircle, Search, X } from "lucide-react"

interface Document {
  id: string
  name: string
  type: string
  uploadDate: string
  expiryDate?: string
  status: 'active' | 'expiring' | 'expired'
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Assicurazione Auto',
    type: 'Assicurazione',
    uploadDate: '2024-01-15',
    expiryDate: '2025-06-30',
    status: 'active'
  },
  {
    id: '2',
    name: 'Contratto Affitto',
    type: 'Contratto',
    uploadDate: '2024-02-01',
    expiryDate: '2025-01-31',
    status: 'expiring'
  },
  {
    id: '3',
    name: 'Fattura Elettricità Nov',
    type: 'Fattura',
    uploadDate: '2024-11-05',
    expiryDate: '2024-12-05',
    status: 'expired'
  },
  {
    id: '4',
    name: 'Certificato SSL',
    type: 'Certificato',
    uploadDate: '2024-03-10',
    expiryDate: '2025-09-15',
    status: 'active'
  },
  {
    id: '5',
    name: 'Assicurazione Casa',
    type: 'Assicurazione',
    uploadDate: '2024-03-20',
    expiryDate: '2025-12-31',
    status: 'active'
  }
]

export default function DashboardPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDocuments = mockDocuments.filter(doc => {
    if (filter !== 'all' && doc.status !== filter) return false
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchName = doc.name.toLowerCase().includes(query)
      const matchType = doc.type.toLowerCase().includes(query)
      return matchName || matchType
    }
    
    return true
  })

  const stats = [
    {
      title: 'Documenti Totali',
      value: filteredDocuments.length,
      icon: FileText,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10'
    },
    {
      title: 'In Scadenza',
      value: filteredDocuments.filter(d => d.status === 'expiring').length,
      icon: Calendar,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10'
    },
    {
      title: 'Scaduti',
      value: filteredDocuments.filter(d => d.status === 'expired').length,
      icon: AlertCircle,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/10'
    }
  ]

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/15 text-green-700 dark:bg-green-400/15 dark:text-green-200 border border-green-500/25'
      case 'expiring':
        return 'bg-orange-500/20 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-500/30'
      case 'expired':
        return 'bg-red-500/20 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-500/30'
    }
  }

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'active':
        return 'Attivo'
      case 'expiring':
        return 'In scadenza'
      case 'expired':
        return 'Scaduto'
    }
  }

  const clearSearch = () => setSearchQuery('')

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Gestisci i tuoi documenti e scadenze
        </p>
      </div>

      {/* Barra di Ricerca */}
      <div className="glass-card rounded-3xl p-4 shadow-soft">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cerca documenti per nome o tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-10 h-12 rounded-full border-border/50 bg-background/50 
                       focus:bg-background focus:border-primary/50 transition-all text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground 
                         hover:text-foreground transition-colors"
              aria-label="Cancella ricerca"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-3 ml-4">
            {filteredDocuments.length} {filteredDocuments.length === 1 ? 'risultato' : 'risultati'} 
            {' '}per &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      {/* Filtri */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className={`rounded-full px-6 backdrop-blur-sm ${
            filter === 'all' ? '' : 'btn-outline-readable'
          }`}
        >
          Tutti ({mockDocuments.length})
        </Button>

        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
          className={`rounded-full px-6 backdrop-blur-sm ${
            filter === 'active' ? '' : 'btn-outline-readable'
          }`}
        >
          Attivi ({mockDocuments.filter(d => d.status === 'active').length})
        </Button>

        <Button
          variant={filter === 'expiring' ? 'default' : 'outline'}
          onClick={() => setFilter('expiring')}
          className={`rounded-full px-6 backdrop-blur-sm ${
            filter === 'expiring' ? '' : 'btn-outline-readable'
          }`}
        >
          In Scadenza ({mockDocuments.filter(d => d.status === 'expiring').length})
        </Button>

        <Button
          variant={filter === 'expired' ? 'default' : 'outline'}
          onClick={() => setFilter('expired')}
          className={`rounded-full px-6 backdrop-blur-sm ${
            filter === 'expired' ? '' : 'btn-outline-readable'
          }`}
        >
          Scaduti ({mockDocuments.filter(d => d.status === 'expired').length})
        </Button>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.title} 
              className="glass-card rounded-3xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-2">
                    {stat.title}
                  </p>
                  <p className="text-5xl font-bold text-muted-foreground/90">{stat.value}</p>
                </div>
                <div className={`${stat.iconBg} rounded-2xl p-4`}>
                  <Icon className={`h-8 w-8 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Documenti */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-muted-foreground/90">
          {searchQuery 
            ? 'Risultati Ricerca'
            : filter === 'all' 
              ? 'Documenti Recenti' 
              : `Documenti ${getStatusText(filter as Document['status'])}`
          }
        </h2>
        
        {filteredDocuments.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-lg">
              {searchQuery 
                ? `Nessun documento trovato per "${searchQuery}"`
                : 'Nessun documento trovato'
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={clearSearch}
                className="mt-4 rounded-full btn-outline-readable"
              >
                Cancella ricerca
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="glass-card rounded-3xl shadow-soft hover:shadow-soft-lg hover-glow transition-all duration-300 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="bg-primary/10 rounded-2xl p-3 group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${getStatusBadge(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-1">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{doc.type}</p>

                  <div className="space-y-2 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Caricato: {new Date(doc.uploadDate).toLocaleDateString('it-IT')}</span>
                    </div>
                    
                    {doc.expiryDate && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Scadenza: {new Date(doc.expiryDate).toLocaleDateString('it-IT')}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full rounded-full btn-outline-readable transition-all
                               hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    Visualizza
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}