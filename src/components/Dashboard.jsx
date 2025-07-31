import React, { useState, useEffect } from 'react';


const DashboardPage = () => {
    const { user, token } = useAuth();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name || '', email: user.email || '' });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`https://localeats.onrender.com/${user._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Update failed');
                alert('Profile updated successfully!');
                setEditing(false);
            } else {
                throw new Error('Unexpected response from server.');
            }
        } catch (err) {
            console.error('Update error:', err);
            alert(err.message || 'Error updating profile');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-4 py-16">
            <div className="max-w-2xl mx-auto bg-white bg-opacity-10 p-8 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-6 text-center">Dashboard</h1>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Name:</label>
                        {editing ? (
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded text-black"
                            />
                        ) : (
                            <p>{formData.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Email:</label>
                        {editing ? (
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded text-black"
                            />
                        ) : (
                            <p>{formData.email}</p>
                        )}
                    </div>

                    <div className="text-center">
                        {editing ? (
                            <button
                                onClick={handleSave}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded transition"
                            >
                                Save
                            </button>
                        ) : (
                            <button
                                onClick={() => setEditing(true)}
                                className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded transition"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
