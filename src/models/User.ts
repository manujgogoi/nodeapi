import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {type: String, required: false},
    email: {type: String, required: false},
    phone: {type: String, required: true},
    userType: {type: String, enum: ['admin', 'doctor', 'patient', 'hospital', 'lab'], default: 'patient'},
    password: {type: String, required: true, select: false},
});

export const UserModel = mongoose.model('User', UserSchema);

// DATABASE QUERIES
// ====================================================
export const getUsers = () => UserModel.find();
export const getUsersByType = (type: string) => UserModel.find({userType: type});
export const getUsersByTypes = (userTypes: string[]) => UserModel.find({ userType: { $in: userTypes } });
export const getUserByEmail = (email: string) => UserModel.findOne({email});
export const getUserByPhone = (phone: string) => UserModel.findOne({phone});
export const getUserById = (id: string) => UserModel.findById(id);
export const createUser = (values: Record<string, any>) => new UserModel(values)
    .save()
    .then((user) => user.toObject());

export const deleteUserById = (id: string) => UserModel.findOneAndDelete({_id: id});
export const updateUserById = (id: string, values: Record<string, any>) => UserModel.findByIdAndUpdate(id, values);
