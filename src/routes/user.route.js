import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeUserPassword, 
    changeUserDetails, 
    changeUserAvatar, 
    changeUserCoverImage 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secure routes 
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").patch(verifyJWT, changeUserPassword)
router.route("/change-user-details").patch(verifyJWT, changeUserDetails )
router.route("/change-user-avatar").patch(verifyJWT, upload.single("avatar"), changeUserAvatar)
router.route("/change-user-coverimage").patch(verifyJWT, upload.single("coverImage"), changeUserCoverImage)

export default router;