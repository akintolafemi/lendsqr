type User = {
  user: any;
};

type RequestWithUser = Request & User;

export default RequestWithUser;
