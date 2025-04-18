const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config();
class Mailer{
 constructor(){
    this.transporter = nodemailer.createTransport({
        host: process.env.HOST,
        service: process.env.SERVICE,
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    this.sendEmail = this.sendEmail.bind(this);
 }
    async sendEmail(email, subject, text){
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: subject,
                text: text,
            });

            // console.log("email sent sucessfully");
            return {
                status:'sent'
            }
        } catch (error) {
            // console.log(error, "email not sent");
            return {
                status:'mail failed'
            }
        }
    };
}


module.exports = new Mailer();