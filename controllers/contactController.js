const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'autobotsolution@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Send contact email
exports.sendContactEmail = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Email to admin
        const adminMailOptions = {
            from: process.env.EMAIL_USER || 'autobotsolution@gmail.com',
            to: 'autobotsolution@gmail.com',
            subject: `NEXUS Contact Form: ${subject}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p><small>Sent from NEXUS Support System Contact Form</small></p>
            `
        };
        
        // Auto-reply to user
        const userMailOptions = {
            from: process.env.EMAIL_USER || 'autobotsolution@gmail.com',
            to: email,
            subject: 'Thank you for contacting NEXUS Support System',
            html: `
                <h3>Thank you for contacting us!</h3>
                <p>Dear ${name},</p>
                <p>We have received your message and will get back to you as soon as possible.</p>
                <p><strong>Your message:</strong></p>
                <p>${message}</p>
                <hr>
                <p><strong>Contact Information:</strong></p>
                <p>Email: autobotsolution@gmail.com</p>
                <p>Company: Auto Bot Solution</p>
                <p>Owner: Robert Trenaman</p>
                <p>Location: Flushing, MI</p>
                <hr>
                <p><small>This is an automated message from NEXUS Support System</small></p>
            `
        };
        
        // Send emails
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);
        
        res.json({
            success: true,
            message: 'Email sent successfully'
        });
        
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email'
        });
    }
};
