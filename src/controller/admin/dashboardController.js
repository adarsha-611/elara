import { getDashboardData } from "../../services/admin/dashboardService.js";

const getDashboardPage = async(req,res)=>{
    try {
        const data = await getDashboardData();

        res.render("admin/dashboard",{
            currentPage: 'dashboard',
            sidebarPage:"dashboard",
            ...data
        })
    } catch (error) {
       console.log(error);
       res.status(500).send("server error") 
    }
}

export default{
    getDashboardPage
}