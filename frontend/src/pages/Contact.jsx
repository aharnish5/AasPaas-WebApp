const Contact = () => {
  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
      <div className="max-w-2xl">
        <p className="text-lg text-gray-600 mb-8">
          Have questions? Get in touch with us.
        </p>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-gray-600">support@aaspaas.com</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Phone</h3>
            <p className="text-gray-600">+91 123 456 7890</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact

