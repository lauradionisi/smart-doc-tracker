'use client'

import { useState } from 'react'  
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, AlertCircle } from "lucide-react"

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
  }
]

export default function DashboardPage() {

  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all')
  

  const filteredDocuments = filter === 'all' 
    ? mockDocuments 
    : mockDocuments.filter(doc => doc.status === filter)
  

  const stats = [
    {
      title: 'Documenti Totali',
      value: filteredDocuments.length,
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'In Scadenza',
      value: filteredDocuments.filter(d => d.status === 'expiring').length,
      icon: Calendar,
      color: 'text-orange-600'
    },
    {
      title: 'Scaduti',
      value: filteredDocuments.filter(d => d.status === 'expired').length,
      icon: AlertCircle,
      color: 'text-red-600'
    }
  ]

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expiring':
        return 'bg-orange-100 text-orange-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          Gestisci i tuoi documenti e scadenze
        </p>
      </div>


      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Tutti ({mockDocuments.length})
        </Button>
        <Button 
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          Attivi ({mockDocuments.filter(d => d.status === 'active').length})
        </Button>
        <Button 
          variant={filter === 'expiring' ? 'default' : 'outline'}
          onClick={() => setFilter('expiring')}
        >
          In Scadenza ({mockDocuments.filter(d => d.status === 'expiring').length})
        </Button>
        <Button 
          variant={filter === 'expired' ? 'default' : 'outline'}
          onClick={() => setFilter('expired')}
        >
          Scaduti ({mockDocuments.filter(d => d.status === 'expired').length})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          {filter === 'all' ? 'Documenti Recenti' : `Documenti ${getStatusText(filter as Document['status'])}`}
        </h2>
        
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nessun documento trovato con questo filtro
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                  <CardTitle className="mt-4 text-lg">{doc.name}</CardTitle>
                  <CardDescription>{doc.type}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}