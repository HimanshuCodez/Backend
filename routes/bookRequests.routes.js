import express from "express";
import authenticateToken from "./userAuth.routes.js"; // Token validation middleware
import BookRequest from "../models/bookRequest.model.js"; // Book request model

const router = express.Router();

// User Routes

// Submit a book request
router.post("/request-book", authenticateToken, async (req, res) => {
  try { 
    const { bookTitle, author, isbn, message } = req.body;

    // Validate ISBN format (optional but recommended)
    if (!/^\d{13}$/.test(isbn)) {
      return res.status(400).json({ error: "Invalid ISBN format. ISBN should be a 13-digit number." });
    }

    // Create a new request
    const newRequest = new BookRequest({
      user: req.user.id, // User ID from token
      bookTitle,
      author,
      isbn,
      message
    });

    await newRequest.save();  // Save the request
    res.status(201).json({ message: "Book request submitted successfully", request: newRequest });
  } catch (error) {
    console.error("Error in request-book route:", error);
    res.status(500).json({ error: "Failed to submit the book request." });
  }
});
//all reqs from users
router.get("/user-requests", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from the token

    // Fetch all requests made by the user
    const userRequests = await BookRequest.find({ user: userId });

    if (!userRequests.length) {
      return res.status(404).json({ message: "No requests found." });
    }

    res.status(200).json(userRequests); // Return user's requests
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ error: "Failed to fetch requests." });
  }
});
//fetches users all requests
router.get("/admin/requests", async (req, res) => {
  try {
    // Fetch all requests and populate user details
    const requests = await BookRequest.find()
      .populate("user", "username email")  

    if (!requests) {
      return res.status(404).json({ error: "No requests found." });
    }

    res.status(200).json(requests);  
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch requests." });
  }
});


// Update request status (Admin)
router.patch("/admin/request/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;  // Extract the new status from the request body
    const updatedRequest = await BookRequest.findByIdAndUpdate(
      id,  // Request ID to be updated
      { status },  // New status value
      { new: true }  // Return the updated document
    );
    res.status(200).json(updatedRequest);  // Send the updated request back
  } catch (error) {
    res.status(500).json({ error: "Failed to update request status." });
  }
});

export default router;
