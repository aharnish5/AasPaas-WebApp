const Contact = () => {
  return (
    <div className="container-custom py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold text-text">Contact Us</h1>
        <p className="max-w-2xl text-base text-text-muted sm:text-lg">
          We’re here to help vendors and customers alike. Reach out and we’ll get back within one business day.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {[{
          title: 'Email', value: 'support@aaspaas.com'
        }, { title: 'Phone', value: '+91 123 456 7890' }, { title: 'Hours', value: 'Mon–Fri, 10am–6pm IST' }].map((c) => (
          <div key={c.title} className="glass-card rounded-3xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-text-muted">{c.title}</h3>
            <p className="mt-2 text-base font-semibold text-text">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="glass-card rounded-[28px] p-8">
        <h2 className="text-2xl font-semibold text-text">Send us a message</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="input-label">Name</label>
            <input className="input-field" placeholder="Your name" />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input className="input-field" type="email" placeholder="you@example.com" />
          </div>
          <div className="md:col-span-2">
            <label className="input-label">Message</label>
            <textarea className="input-field" placeholder="How can we help?" rows={5} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="btn-gradient">Send message</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default Contact

