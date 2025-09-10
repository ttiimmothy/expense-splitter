import {prisma} from "@/db/prisma";
import {Request, Response, NextFunction} from "express"

export const requireGroupOwner = async (req:Request, res:Response, next: NextFunction) => {
  const user = req.user
  const {groupId} = req.params

  if (!groupId) {
    res.status(404).json({error: "group id is missing"})
    return
  }

  const member = await prisma.groupMember.findUnique({
    where: {userId_groupId: {userId:user.id, groupId}}
  })

  if (member.role !== "OWNER") {
    res.status(403).json({error: "Only group owner can do this action"})
    return
  }
  next()
}