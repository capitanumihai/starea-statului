import { useEffect, useMemo, useState, memo } from 'react'
import { ReactFlow, ReactFlowProvider, Handle, Position, useReactFlow } from '@xyflow/react'
import { PlusIcon, MinusIcon, CrosshairIcon, CaretLeftIcon, CaretRightIcon, ArrowsOutSimpleIcon } from '@phosphor-icons/react'
import { institutions, categories, categoryById, institutionById, statusMeta, emptyReading } from './data'
import { InstitutionIcon } from './icons'
import '@xyflow/react/dist/style.css'

const images = new Set(['parliament', 'chamber', 'senate', 'mai'])
const InstitutionNode = memo(function InstitutionNode({ data }) {
  const { item, reading, selected, onSelect, root, onExpand } = data
  return <div className={`institution-node ${root ? 'root-node' : ''} ${selected ? 'is-selected' : ''}`}>
    {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((position) => <Handle key={position} id={position} type="source" position={position} isConnectable={false} />)}
    {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((position) => <Handle key={`target-${position}`} id={`target-${position}`} type="target" position={position} isConnectable={false} />)}
    <button type="button" className="node-button nodrag nopan" onClick={(event) => { event.stopPropagation(); onSelect(item.id) }} aria-label={`${item.shortName}, ${reading ? statusMeta[reading.status].label : 'grup de navigare'}`} aria-pressed={selected}>
      <span className={`node-portrait ${reading ? reading.status : 'group-portrait'}`}>
        {images.has(item.image) ? <img src={`/assets/${item.image}.webp`} alt="" draggable="false" width="150" height="150" /> : <InstitutionIcon kind={item.image} size={root ? 62 : 43} />}
        {root && <span className="portrait-orbit" />}
      </span>
      <strong>{item.shortName}</strong>
      {reading ? <span className={`node-status status-${reading.status}`}><i className="status-dot" />{statusMeta[reading.status].label}</span> : <span className="node-description">{item.count} instituții</span>}
    </button>
    {onExpand && <button className="node-expand" onClick={onExpand} aria-label={`Explorează ${item.shortName}`}><ArrowsOutSimpleIcon size={14} /></button>}
  </div>
})

const nodeTypes = { institution: InstitutionNode }
const motionDuration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250
const panoramaIds = ['ghiseul', 'spv', 'roeid', 'hubmai', 'cdep', 'senat', 'sri', 'dna']
const panoramaPositions = [
  { x: 20, y: 110 }, { x: 790, y: 110 }, { x: 30, y: 365 }, { x: 790, y: 365 },
  { x: 300, y: 365 }, { x: 520, y: 365 }, { x: 215, y: 0 }, { x: 620, y: 0 },
]

function MapContents({ category, selectedId, readings, onSelect, onOpenCategory }) {
  const [page, setPage] = useState(0)
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const list = category === 'panorama' ? panoramaIds.map((id) => institutionById[id]) : institutions.filter((item) => item.category === category)
  const pageCount = Math.max(1, Math.ceil(list.length / 10))
  useEffect(() => {
    const index = list.findIndex((item) => item.id === selectedId)
    setPage(category === 'panorama' ? 0 : Math.max(0, Math.floor(index / 10)))
  }, [category, selectedId])
  const pageItems = category === 'panorama' ? list : list.slice(page * 10, page * 10 + 10)

  const nodes = useMemo(() => {
    const rootItem = category === 'panorama' || category === 'parlament'
      ? { id: 'parliament-root', shortName: 'Parlamentul României', image: 'parliament', count: 2 }
      : { id: `category-${category}`, shortName: categoryById[category].name, image: categoryById[category].icon, count: list.length }
    const chamberStates = ['cdep', 'senat'].map((id) => readings[id]?.status || 'unknown')
    const chamberStatus = chamberStates.includes('down') ? 'down' : chamberStates.every((status) => ['up', 'slow'].includes(status)) ? chamberStates.includes('slow') ? 'slow' : 'up' : 'unknown'
    const rootReading = category === 'panorama' || category === 'parlament' ? { status: chamberStatus } : null
    const children = pageItems.map((item, index) => {
      const angle = -Math.PI / 2 + index * 2 * Math.PI / Math.max(pageItems.length, 1)
      const position = category === 'panorama' ? panoramaPositions[index] : { x: 405 + Math.cos(angle) * 390, y: 240 + Math.sin(angle) * 235 }
      return { id: item.id, type: 'institution', position, data: { item, reading: readings[item.id] || emptyReading(item.id), selected: selectedId === item.id, onSelect }, selectable: false, draggable: false, focusable: false, width: 180, height: 150 }
    })
    return [{ id: rootItem.id, type: 'institution', position: { x: 405, y: 160 }, data: { item: rootItem, reading: rootReading, root: true, selected: false, onSelect: () => onOpenCategory(category === 'panorama' ? 'parlament' : category) }, draggable: false, selectable: false, focusable: false, width: 190, height: 205 }, ...children]
  }, [category, pageItems.map((item) => item.id).join(','), readings, selectedId, onSelect, onOpenCategory])

  const edges = useMemo(() => nodes.slice(1).map((node) => {
    const root = nodes[0]
    const dx = node.position.x - root.position.x
    const dy = node.position.y - root.position.y
    const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'bottom' : 'top'
    const opposite = { right: 'left', left: 'right', top: 'bottom', bottom: 'top' }[direction]
    const institutional = ['cdep', 'senat'].includes(node.id) && ['panorama', 'parlament'].includes(category)
    return { id: `root-${node.id}`, source: root.id, target: node.id, sourceHandle: direction, targetHandle: `target-${opposite}`, type: 'straight', style: { stroke: institutional ? '#70b9f5' : '#8299a4', strokeWidth: 1.1, strokeDasharray: institutional ? undefined : '5 7', opacity: 0.7 }, focusable: false, selectable: false }
  }), [nodes, category])

  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.09, duration: motionDuration(), maxZoom: 1.1 }), 100)
    return () => clearTimeout(timer)
  }, [category, page, fitView])

  useEffect(() => {
    const element = document.querySelector('.map-canvas')
    const observer = new ResizeObserver(() => fitView({ padding: 0.09, duration: 0, maxZoom: 1.1 }))
    if (element) observer.observe(element)
    return () => observer.disconnect()
  }, [fitView])

  return <>
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={(_event, node) => { if (institutionById[node.id]) onSelect(node.id) }} fitView fitViewOptions={{ padding: 0.09, maxZoom: 1.1 }} minZoom={0.4} maxZoom={1.8} nodesConnectable={false} nodesDraggable={false} elementsSelectable={false} panOnDrag zoomOnScroll={false} zoomOnPinch proOptions={{ hideAttribution: false }} aria-label="Harta instituțiilor și serviciilor publice">
    </ReactFlow>
    <div className="map-hint"><span className="map-hint-dot" />Selectează un nod pentru detalii</div>
    <div className="map-bottom">
      <div className="map-legend"><span><i className="legend-line institutional" />Legături instituționale</span><span><i className="legend-line" />Legături de navigare</span></div>
      <div className="map-tools">
        {pageCount > 1 && <div className="map-pagination"><button aria-label="Pagina anterioară a hărții" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><CaretLeftIcon /></button><span>{page + 1} / {pageCount}</span><button aria-label="Pagina următoare a hărții" disabled={page >= pageCount - 1} onClick={() => setPage((value) => value + 1)}><CaretRightIcon /></button></div>}
        <div className="zoom-tools"><button aria-label="Mărește harta" onClick={() => zoomIn({ duration: motionDuration() })}><PlusIcon size={20} /></button><button aria-label="Micșorează harta" onClick={() => zoomOut({ duration: motionDuration() })}><MinusIcon size={20} /></button><button aria-label="Centrează harta" onClick={() => fitView({ padding: 0.09, duration: motionDuration(), maxZoom: 1.1 })}><CrosshairIcon size={19} /></button></div>
      </div>
    </div>
  </>
}

export default function ServiceMap(props) {
  return <ReactFlowProvider><MapContents {...props} /></ReactFlowProvider>
}
