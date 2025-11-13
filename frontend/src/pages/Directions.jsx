import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

const Directions = () => {
	return (
		<div className="max-w-6xl mx-auto px-4 py-8">
			<div className="mb-6">
				<div className="flex items-center gap-3">
					<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/20 to-accent/20 text-primary">
						<MapPin className="h-5 w-5" />
					</span>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Directions</h1>
						<p className="text-[var(--text-muted)]">Find the best way to your selected shop</p>
					</div>
				</div>
			</div>

			<div className="surface-card border border-[var(--border-default)] rounded-xl p-6">
				<p className="text-[var(--text-secondary)]">
					We’ll soon provide in-app directions with turn-by-turn guidance. For now, you can open the
					shop in your preferred maps app from the shop card actions.
				</p>
				<div className="mt-4">
					<Link to="/search" className="btn-gradient inline-flex items-center gap-2">
						Back to Search
					</Link>
				</div>
			</div>
		</div>
	)
}

export default Directions

