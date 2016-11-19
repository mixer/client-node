export interface BeamRequest<T> {
    /**
     * Body containing the data requested. (Or an error)
     */
    body: T;
}
