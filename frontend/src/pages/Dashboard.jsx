
<Tabs defaultActiveKey="all" className="mb-3">
  <Tab eventKey="all" title="Tutti">
    <ItemsList items={items} onDeleteItem={handleDeleteItem} />
  </Tab>
  <Tab eventKey="open" title="Disponibili">
    <ItemsList 
      items={items.filter(item => item.status === 'open')} 
      onDeleteItem={handleDeleteItem} 
    />
  </Tab>
  <Tab eventKey="claimed" title="Reclamati">
    <ItemsList 
      items={items.filter(item => item.status === 'claimed')} 
      onDeleteItem={handleDeleteItem} 
    />
  </Tab>
  <Tab eventKey="resolved" title="Risolti">
    <ItemsList 
      items={items.filter(item => item.status === 'resolved')} 
      onDeleteItem={handleDeleteItem} 
    />
  </Tab>
</Tabs>