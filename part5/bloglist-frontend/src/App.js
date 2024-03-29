import { useState, useEffect, useRef } from 'react'
import Blog from './components/Blog'
import blogService from './services/blogs'
import loginService from './services/login'
import LoginForm from './components/LoginForm'
import Notification from './components/Notification'
import BlogForm from './components/BlogForm'
import Togglable from './components/Togglable'

const App = () => {
    const [blogs, setBlogs] = useState([])
    const [message, setMessage] = useState(null)
    const [user, setUser] = useState('')

    useEffect(() => {
        blogService.getAll().then((blogs) => setBlogs(blogs))
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setMessage(null)
        }, 5000)
        return () => {
            clearTimeout(timer)
        }
    }, [message])

    useEffect(() => {
        const loggedUserJSON = window.localStorage.getItem('loggedBlogappUser')
        if (loggedUserJSON) {
            const user = JSON.parse(loggedUserJSON)
            setUser(user)
            blogService.setToken(user.token)
        }
    }, [])

    const handleLogin = async (username, password) => {
        try {
            const user = await loginService.login({
                username,
                password,
            })
            window.localStorage.setItem(
                'loggedBlogappUser',
                JSON.stringify(user)
            )
            blogService.setToken(user.token)
            setUser(user)
        } catch (exception) {
            setMessage('Error: Wrong Credentials!')
        }
    }

    const handleLogout = () => {
        window.localStorage.clear()
        setUser(null)
    }

    const createBlog = async (title, author, url) => {
        try {
            const blog = await blogService.create({
                title,
                author,
                url,
            })
            setBlogs(blogs.concat(blog))
            setMessage(`A new blog ${title} by ${author} added`)
        } catch (exception) {
            setMessage(
                'Error: Please fill out all the fields to add a new blog'
            )
        }
    }

    const updateLikes = async (id, blogToUpdate) => {
        try {
            const updatedBlog = await blogService.update(id, blogToUpdate)
            const newBlogs = blogs.map((blog) =>
                blog.id === id ? updatedBlog : blog
            )
            setBlogs(newBlogs)
        } catch (exception) {
            setMessage('error' + exception.response.data.error)
        }
    }

    const deleteBlog = async (blogId) => {
        try {
            await blogService.remove(blogId)

            const updatedBlogs = blogs.filter((blog) => blog.id !== blogId)
            setBlogs(updatedBlogs)
            setMessage('Blog Removed')
        } catch (exception) {
            setMessage('error' + exception.response.data.error)
        }
    }

    const blogFormRef = useRef()

    return (
        <div>
            <h1>Blogs</h1>
            <Notification message={message} />

            {user === null ? (
                <LoginForm handleLogin={handleLogin} />
            ) : (
                <div>
                    <p>
                        <span>{user.name}</span> logged in
                        <button onClick={handleLogout}>logout</button>
                    </p>
                    <Togglable buttonLabel='new blog' ref={blogFormRef}>
                        <BlogForm createBlog={createBlog} />
                    </Togglable>
                    {blogs
                        .sort((a, b) => b.likes - a.likes)
                        .map((blog) => (
                            <Blog
                                key={blog.id}
                                blog={blog}
                                updateLikes={updateLikes}
                                deleteBlog={deleteBlog}
                                username={user.username}
                            />
                        ))}
                </div>
            )}
        </div>
    )
}

export default App
