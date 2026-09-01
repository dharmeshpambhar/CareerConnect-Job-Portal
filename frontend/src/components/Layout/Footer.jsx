import React, { useContext } from 'react'
import {Context} from "../../main"
import {Link} from "react-router-dom"
import { FaGithub , FaLinkedin} from "react-icons/fa"
import { SiLeetcode } from "react-icons/si";
import { RiInstagramFill} from "react-icons/ri"
function Footer() {
  return (
    <footer className="footerShow">
<div>&copy; All Rights Reserved by careerconnect.</div>
<div>
  <Link to={'https://github.com/dharmeshpambhar'} target='github'><FaGithub></FaGithub></Link>
  <Link to={'https://leetcode.com/'} target='leetcode'><SiLeetcode></SiLeetcode></Link>
  <Link to={'https://www.linkedin.com/in/dharmesh-pambhar-310858367/'} target='linkedin'><FaLinkedin></FaLinkedin></Link>
  <Link to={'https://www.instagram.com/'} target='instagram'><RiInstagramFill></RiInstagramFill></Link>
</div>
      
    </footer>
  )
}

export default Footer